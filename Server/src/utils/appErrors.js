const ErrorCodes = require("./errorCodes");

class AppError extends Error {
  constructor(message, statusCode, details = null, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode || this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.errorCode,
      status: this.statusCode,
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado", details = null, errorCode= ErrorCodes.NOT_FOUND) {
    super(message, 404, details, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message = "Datos inválidos", details = null, errorCode= ErrorCodes.VALIDATION_ERROR) {
    super(message, 400, details, errorCode);
    
  }
}

class DatabaseError extends AppError {
  constructor(message = "Error de base de datos", details = null, errorCode=ErrorCodes.DATABASE_ERROR) {
    super(message, 500, details, errorCode );
  }
}

class AuthenticationError extends AppError {
  constructor(message = "No autorizado", details = null, errorCode=ErrorCodes.UNAUTHORIZED) {
    super(message, 401, details, errorCode);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflicto con el recurso", details = null, errorCode= ErrorCodes.CONFLICT) {
    super(message, 409, details, errorCode);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Límite de solicitudes excedido", details = null, errorCode=ErrorCodes.RATE_LIMIT_EXCEEDED) {
    super(message, 429, details, errorCode); // 429 Too Many Requests
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Acceso prohibido", details = null, errorCode=ErrorCodes.FORBIDDEN) {
    super(message, 403, details, errorCode); // 403 Forbidden
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = "Servicio no disponible", details = null) {
    super(message, 503, details, ErrorCodes.SERVICE_UNAVAILABLE); // 503 Service Unavailable
    // this.name = 'ServiceUnavailableError';
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
  ForbiddenError,
  ServiceUnavailableError,
};
