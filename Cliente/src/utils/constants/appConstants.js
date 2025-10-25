export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
  MAX_CONCURRENT_REQUESTS: 5
};

export const STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_EMAIL: 'userEmail', 
  USER_USERNAME: 'userUsername',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'Tu sesión ha expirado.',
  TIMEOUT: 'La petición tardó demasiado tiempo.',
  DEFAULT: 'Ha ocurrido un error inesperado.'
};

export const HTTP_STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  SERVER_ERROR: 500
};

export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Todo list',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development'
};