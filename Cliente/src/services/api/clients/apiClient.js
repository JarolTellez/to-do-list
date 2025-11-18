import {
  API_CONFIG,
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
} from "../../../utils/constants/appConstants";
import { authService } from "../../auth";
import { handleErrorResponse, handleApiResponse } from "../utils/httpUtils";
import { ApiError } from "../utils/apiError";

/**
 * HTTP API client with request management and error handling
 * @class ApiClient
 * @description Handles all API communications with retry logic, token refresh, and error management
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.retryCount = 0;
    this.pendingRequests = new Map();
    this.authErrorHandled = false;
  }

  /**
   * Main request method with request deduplication
   * @async
   * @function request
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response data
   */
  async request(url, options = {}) {
    const requestKey = this.generateRequestKey(url, options);

    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this.executeRequest(url, options);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Executes API request with error handling and token refresh
   * @async
   * @function executeRequest
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response data
   * @throws {ApiError} When request fails
   */
  async executeRequest(url, options) {
    try {
      const response = await this.makeRequest(url, options);
      const result = await handleApiResponse(response);

      if (!result.success) {
        if (
          response.status === HTTP_STATUS_CODES.UNAUTHORIZED &&
          result.code === "ACCESS_TOKEN_EXPIRED" &&
          this.retryCount < API_CONFIG.RETRY_ATTEMPTS
        ) {
          return await this.handleTokenRefresh(url, options);
        }

        throw new ApiError(
          result.message || ERROR_MESSAGES.DEFAULT,
          result.status || HTTP_STATUS_CODES.BAD_REQUEST,
          result.code || "API_ERROR"
        );
      }

      this.resetRetryCount();
      return result;
    } catch (error) {
      if (
        error.status === HTTP_STATUS_CODES.UNAUTHORIZED &&
        error.code === "ACCESS_TOKEN_EXPIRED"
      ) {
        return await this.handleTokenRefresh(url, options);
      }

      if (error.status === HTTP_STATUS_CODES.UNAUTHORIZED) {
        this.handlePersistentAuthError(error);
      }
      throw error;
    }
  }

  /**
   * Handles access token refresh and request retry
   * @async
   * @function handleTokenRefresh
   * @param {string} url - Original request URL
   * @param {Object} options - Original request options
   * @returns {Promise<Object>} Retried request result
   * @throws {ApiError} When token refresh fails
   */
  async handleTokenRefresh(url, options) {
    try {
      console.log("Renovando access token");
      await authService.refreshAccessToken();
      this.retryCount++;

      const retryResponse = await this.makeRequest(url, options);
      const retryResult = await handleApiResponse(retryResponse);

      if (retryResult.success) {
        this.resetRetryCount();
        console.log("Access token renovado");
        return retryResult;
      } else {
        const error = await handleErrorResponse(retryResponse);
        throw error;
      }
    } catch (refreshError) {
      console.error("Error al refrescar token:", refreshError);

      if (refreshError.status === HTTP_STATUS_CODES.UNAUTHORIZED) {
        this.handlePersistentAuthError(refreshError);
      }
      throw refreshError;
    }
  }

  /**
   * Makes actual HTTP request with timeout
   * @async
   * @function makeRequest
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   * @throws {ApiError} When request fails
   */
  async makeRequest(url, options) {
    const defaultOptions = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const completeURL = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(completeURL, {
        ...defaultOptions,
        ...options,
        signal: controller.signal,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      return response;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new ApiError(
          ERROR_MESSAGES.TIMEOUT,
          HTTP_STATUS_CODES.TIMEOUT,
          "REQUEST_TIMEOUT"
        );
      }

      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError")
      ) {
        throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR, 0, "NETWORK_ERROR");
      }

      throw new ApiError(
        error.message || ERROR_MESSAGES.DEFAULT,
        error.status || 500,
        "UNKNOWN_ERROR"
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handles persistent authentication errors and dispatches session expired event
   * @function handlePersistentAuthError
   * @param {ApiError} error - Authentication error
   */
  handlePersistentAuthError(error) {
    if (this.authErrorHandled) return;

    this.authErrorHandled = true;

    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === "/login" || currentPath === "/register";

    const isSessionError =
      error?.code === "NO_ACTIVE_SESSION" ||
      error?.code === "INVALID_SESSION" ||
      (error?.message &&
        (error.message.includes("No hay sesión activa") ||
          error.message.includes("Sesión no válida")));

    if (!(isSessionError && isAuthPage)) {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      }
    }

    setTimeout(() => {
      this.authErrorHandled = false;
    }, 2000);
  }

  /**
   * Generates unique key for request deduplication
   * @function generateRequestKey
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {string} Unique request key
   */
  generateRequestKey(url, options) {
    const method = options.method || "GET";
    const body = options.body ? JSON.stringify(options.body) : "";
    return `${method}:${url}:${body}`;
  }

  /**
   * Resets retry counter
   * @function resetRetryCount
   */
  resetRetryCount() {
    this.retryCount = 0;
  }

  /**
   * Creates HTTP method wrapper with standardized configuration
   * @function createHttpMethod
   * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @returns {Function} Configured HTTP method function
   */
  createHttpMethod(method) {
    return async (url, data = null, options = {}) => {
      const config = {
        ...options,
        method: method.toUpperCase(),
      };

      if (method.toUpperCase() === "GET" && data) {
        if (data.params) {
          const queryParams = new URLSearchParams();
          Object.entries(data.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          });
          const queryString = queryParams.toString();
          url = queryString ? `${url}?${queryString}` : url;
        }
        data = null;
      }

      if (data !== null && method.toUpperCase() !== "GET") {
        config.body = JSON.stringify(data);
        config.headers = {
          ...config.headers,
          "Content-Type": "application/json",
        };
      }

      this.resetRetryCount();
      return await this.request(url, config);
    };
  }

  get api() {
    return {
      get: this.createHttpMethod("GET"),
      post: this.createHttpMethod("POST"),
      put: this.createHttpMethod("PUT"),
      patch: this.createHttpMethod("PATCH"),
      delete: this.createHttpMethod("DELETE"),
    };
  }
}

export const apiClient = new ApiClient();
