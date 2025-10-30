// import { API_CONFIG } from '../api.js';
// import { handleApiResponse } from '../utils/httpUtils.js';

// const API_BASE_URL = API_CONFIG.BASE_URL;

// export class AuthClient {
//   constructor() {
//     this.baseURL = API_BASE_URL;
//   }

//   async request(url, options = {}) {
//     const defaultOptions = {
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     };

//     const completeURL = url.startsWith("http") ? url : `${this.baseURL}${url}`;

//     const response = await fetch(completeURL, {
//       ...defaultOptions,
//       ...options,
//       headers: {
//         ...defaultOptions.headers,
//         ...options.headers,
//       },
//     });
    
//     const apiResponse= await handleApiResponse(response);
//        if(!apiResponse.success){
//           throw new Error(apiResponse.message)
//         }

//     return apiResponse;
//   }

//   async post(url, data = null, options = {}) {
//     const config = {
//       ...options,
//       method: "POST",
//     };

//     if (data) {
//       config.body = JSON.stringify(data);
//     }

//     return this.request(url, config);
//   }

//   async get(url, options = {}) {
//     return this.request(url, { ...options, method: "GET" });
//   }
// }

// export const authClient = new AuthClient();