import { API_CONFIG } from "../api.js";
import { authService } from "../../auth.js";
import { handleErrorResponse, handleApiResponse } from "../utils/httpUtils.js";
import { ApiError } from "../utils/ApiError.js";

const API_BASE_URL = API_CONFIG.BASE_URL;
const MAX_RETRIES = API_CONFIG.MAX_REINTENTOS;

export class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.retryCount = 0;
    this.isRefreshing = false;
  }

  async request(url, options = {}) {
    try {
      const response = await this.makeRequest(url, options);

      const result = await handleApiResponse(response);

      if (result.success === false) {
        if (response.status === 401 && this.retryCount < MAX_RETRIES) {
          return await this.handleAuthError(url, options, response);
        }

        throw new ApiError(
          result.message,
          result.status || 400,
          result.code || "API_ERROR",
          result.data || {}
        );
      }

      return result;
    } catch (error) {
      console.error(`Error in request to ${url}:`, error);
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

    return await fetch(completeURL, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });
  }

  async handleAuthError(url, options, originalResponse) {
    try {

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

  resetRetryCount() {
    this.retryCount = 0;
  }

  handlePersistentAuthError() {
    authService.clearLocalState();

    console.warn("Persistent authentication error - redirecting to login");

    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
  }

  createHttpMethod(method) {
    return async (url, data = null, options = {}) => {
      const config = {
        ...options,
        method: method.toUpperCase(),
        headers: {
          ...options.headers,
        },
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
          delete config.headers["Content-Type"];
        } else {
          config.body = JSON.stringify(data);
          config.headers["Content-Type"] = "application/json";
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
