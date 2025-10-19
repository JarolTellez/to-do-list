import { API_CONFIG } from '../api.js';
import { TokenManager } from '../utils/tokenManager.js';
import { handleErrorResponse, handleApiResponse } from '../utils/httpUtils.js';
import { ApiError } from '../utils/ApiError.js';

const API_BASE_URL = API_CONFIG.BASE_URL;
const MAX_RETRIES = API_CONFIG.MAX_REINTENTOS;

export class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokenManager = new TokenManager();
  }

  async requestWithAuth(url, options = {}) {
    let accessToken;

    try {
      accessToken = await this.tokenManager.getToken();
    } catch (error) {
      accessToken = null;
    }

    this.tokenManager.resetRetries();

    while (this.tokenManager.canRetry()) {
      try {
        const response = await this.makeRequest(url, options, accessToken);

        if (response.ok) {
          return response;
        }
    
        if(!response.success){
          throw new Error(response.message)
        }
        const status = response.status;

        if (status === 401 && this.tokenManager.canRetry()) {
          try {
            accessToken = await this.tokenManager.renewToken();
            this.tokenManager.incrementRetry();
            continue;
          } catch (refreshError) {
            throw refreshError;
          }
        }

        const error = await handleErrorResponse(response);
        throw error;

      } catch (error) {
        if (error.status === 401) {
          this.tokenManager.redirectToLogin();
        }
        throw error;
      }
    }

    throw new ApiError(
      "Persistent authentication error",
      401,
      "PERSISTENT_AUTH_ERROR",
      { maxRetries: MAX_RETRIES }
    );
  }

  async makeRequest(url, options, accessToken) {
    const defaultOptions = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
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

      try {
        const response = await this.requestWithAuth(url, config);
        return await handleApiResponse(response);
      } catch (error) {
        console.error(`Error in ${method.toUpperCase()} ${url}:`, error);
        throw error;
      }
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
export const api = apiClient.api;

export const ApiUtils = {
  isAuthError: (error) => {
    return (
      error.status === 401 ||
      error.code?.includes("AUTH") ||
      error.code?.includes("TOKEN")
    );
  },

  isNetworkError: (error) => {
    return (
      error.name === "TypeError" && error.message.includes("Failed to fetch")
    );
  },

  isTimeoutError: (error) => {
    return error.code === "REQUEST_TIMEOUT" || error.name === "AbortError";
  },

  getFriendlyMessage: (error) => {
    if (error.message.includes("Failed to fetch")) {
      return "Connection error. Check your internet.";
    }

    if (error.message.includes("Timeout")) {
      return "Request timed out. Please try again.";
    }

    return error.message || "Unknown error";
  }
};