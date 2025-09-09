const { error } = require("winston");
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
  constructor(message = "Recurso no encontrado", details = null) {
    super(message, 404, details, ErrorCodes.NOT_FOUND);
    // this.name = 'NotFoundError';
  }
}

class ValidationError extends AppError {
  constructor(message = "Datos inválidos", details = null) {
    super(message, 400, details, ErrorCodes.VALIDATION_ERROR);
    // this.name = 'ValidationError';
  }
}

class DatabaseError extends AppError {
  constructor(message = "Error de base de datos", details = null) {
    super(message, 500, details, ErrorCodes.DATABASE_ERROR);
    //this.name = 'DatabaseError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = "No autorizado", details = null) {
    super(message, 401, details, ErrorCodes.UNAUTHORIZED);
    //this.name = 'AuthenticationError';
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflicto con el recurso", details = null) {
    super(message, 409, details, ErrorCodes.CONFLICT);
    //this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = "Límite de solicitudes excedido", details = null) {
    super(message, 429, details, ErrorCodes.RATE_LIMIT_EXCEEDED); // 429 Too Many Requests
    //this.name = 'RateLimitError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Acceso prohibido", details = null) {
    super(message, 403, details, ErrorCodes.FORBIDDEN); // 403 Forbidden
    // this.name = 'ForbiddenError';
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
