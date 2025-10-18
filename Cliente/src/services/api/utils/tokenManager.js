import { refreshAccessToken } from '../../auth.js';
import { setAccessToken, getAccessToken, removeAccessToken } from '../../../utils/tokenStorage.js';
import { API_CONFIG } from '../api.js';

const MAX_RETRIES = API_CONFIG.MAX_REINTENTOS;

export class TokenManager {
  constructor() {
    this.retries = 0;
  }

  async getToken() {
    let token = getAccessToken();
    
    if (!token) {
      try {
        const data = await refreshAccessToken();
        setAccessToken(data.accessToken);
        token = data.accessToken;
      } catch (error) {
        console.error("Error getting initial token:", error);
        this.redirectToLogin();
        throw error;
      }
    }
    
    return token;
  }

  async renewToken() {
    try {
      const data = await refreshAccessToken();
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error("Error renewing token:", error);
      removeAccessToken();
      this.redirectToLogin();
      throw error;
    }
  }

  canRetry() {
    return this.retries < MAX_RETRIES;
  }

  incrementRetry() {
    this.retries++;
  }

  resetRetries() {
    this.retries = 0;
  }

  redirectToLogin() {
    console.warn("Redirecting to login...");
    removeAccessToken();
    sessionStorage.clear();
    localStorage.removeItem("rememberMe");
    window.location.replace("/");
  }
}