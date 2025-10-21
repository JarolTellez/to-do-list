// import { refreshAccessToken } from '../../auth.js';
// import { API_CONFIG } from '../api.js';

// const MAX_RETRIES = API_CONFIG.MAX_REINTENTOS;

// export class TokenManager {
//   constructor() {
//     this.retries = 0;
//   }

//   async renewToken() {
//     try {
//       const data = await refreshAccessToken();
//       return data;
//     } catch (error) {
//       console.error("Error renewing token:", error);
//       this.redirectToLogin();
//       throw error;
//     }
//   }

//   canRetry() {
//     return this.retries < MAX_RETRIES;
//   }

//   incrementRetry() {
//     this.retries++;
//   }

//   resetRetries() {
//     this.retries = 0;
//   }

//   redirectToLogin() {
//     console.warn("Redirecting to login...");
//     sessionStorage.clear();
//     localStorage.removeItem("rememberMe");
//     window.location.replace("/");
//   }
// }