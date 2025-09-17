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
  constructor(message = "Resource not found", details = null, errorCode= ErrorCodes.NOT_FOUND) {
    super(message, 404, details, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message = "Invalid data", details = null, errorCode= ErrorCodes.VALIDATION_ERROR) {
    super(message, 400, details, errorCode);
    
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database error", details = null, errorCode=ErrorCodes.DATABASE_ERROR) {
    super(message, 500, details, errorCode );
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Unauthorized", details = null, errorCode=ErrorCodes.UNAUTHORIZED) {
    super(message, 401, details, errorCode);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict", details = null, errorCode= ErrorCodes.CONFLICT) {
    super(message, 409, details, errorCode);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded", details = null, errorCode=ErrorCodes.RATE_LIMIT_EXCEEDED) {
    super(message, 429, details, errorCode); 
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", details = null, errorCode=ErrorCodes.FORBIDDEN) {
    super(message, 403, details, errorCode); 
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details = null) {
    super(message, 503, details, ErrorCodes.SERVICE_UNAVAILABLE);
  
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
