import { API_CONFIG } from "../../../utils/constants/appConstants";
import { authService } from "../../auth";
import { handleErrorResponse, handleApiResponse } from "../utils/httpUtils";
import { ApiError } from "../utils/ApiError";

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.retryCount = 0;
    this.pendingRequests = new Map();
  }

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

  async executeRequest(url, options) {
    try {
      const response = await this.makeRequest(url, options);
      const result = await handleApiResponse(response);

      if (!result.success) {
        if (
          response.status === 401 &&
          this.retryCount < API_CONFIG.RETRY_ATTEMPTS
        ) {
          return await this.handleAuthError(url, options, response);
        }

        throw new ApiError(
          result.message,
          result.status || 400,
          result.code || "API_ERROR",
          result.data || {}
        );
      }

      this.resetRetryCount();
      return result;
    } catch (error) {
      console.error(`API Error [${options.method || "GET"} ${url}]:`, error);

      if (error.status === 401) {
        this.handlePersistentAuthError();
      }

      throw error;
    }
  }

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
          "Timeout: La petición tardó demasiado tiempo",
          408,
          "REQUEST_TIMEOUT",
          { url: completeURL }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async handleAuthError(url, options, originalResponse) {
    try {
      console.log("Token expirado intentando refresh");
      await authService.refreshAccessToken();

      this.retryCount++;

      const retryResponse = await this.makeRequest(url, options);

      if (retryResponse.ok) {
        this.resetRetryCount();
        return await handleApiResponse(retryResponse);
      } else {
        const error = await handleErrorResponse(retryResponse);
        throw error;
      }
    } catch (refreshError) {
      console.error("Error refreshing token:", refreshError);
      this.handlePersistentAuthError();
      throw refreshError;
    }
  }

  handlePersistentAuthError() {
    authService.clearLocalState();
    console.warn("Persistent authentication error - redirecting to login");

    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
  }

  generateRequestKey(url, options) {
    const method = options.method || "GET";
    const body = options.body ? JSON.stringify(options.body) : "";
    return `${method}:${url}:${body}`;
  }

  resetRetryCount() {
    this.retryCount = 0;
  }

  cancelAllPendingRequests() {
    this.pendingRequests.clear();
  }

  createHttpMethod(method) {
    return async (url, data = null, options = {}) => {
      const config = {
        ...options,
        method: method.toUpperCase(),
      };

      if (method.toUpperCase() === "GET" && data && data.params) {
        const queryParams = new URLSearchParams();
        Object.entries(data.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        });
        const queryString = queryParams.toString();
        url = queryString ? `${url}?${queryString}` : url;
        data = null;
      }

      if (data !== null && method.toUpperCase() !== "GET") {
        if (data instanceof FormData) {
          config.body = data;
          delete config.headers?.["Content-Type"];
        } else {
          config.body = JSON.stringify(data);
          config.headers = {
            ...config.headers,
            "Content-Type": "application/json",
          };
        }
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

export { ApiClient };
