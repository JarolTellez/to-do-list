const ErrorCodes = require("./errorCodes");

/**
 * Base application error class with standardized structure
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * Creates a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode] - Error code identifier
   */
  constructor(message, statusCode, details = null, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode || this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
  /**
   * Converts error to JSON format for API responses
   * @returns {Object} Standardized error response object
   */
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

/**
 * Error for resource not found scenarios (404)
 * @class NotFoundError
 * @extends AppError
 */
class NotFoundError extends AppError {
  constructor(
    message = "Resource not found",
    details = null,
    errorCode = ErrorCodes.NOT_FOUND
  ) {
    super(message, 404, details, errorCode);
  }
}

/**
 * Error for data validation failures (400), for example: format or required data
 * @class ValidationError
 * @extends AppError
 */
class ValidationError extends AppError {
  constructor(
    message = "Invalid data",
    details = null,
    errorCode = ErrorCodes.VALIDATION_ERROR
  ) {
    super(message, 400, details, errorCode);
  }
}

/**
 * Error for database operation failures (500)
 * @class DatabaseError
 * @extends AppError
 */
class DatabaseError extends AppError {
  constructor(
    message = "Database error",
    details = null,
    errorCode = ErrorCodes.DATABASE_ERROR
  ) {
    super(message, 500, details, errorCode);
  }
}

/**
 * Error for authentication failures (401)
 * @class AuthenticationError
 * @extends AppError
 */
class AuthenticationError extends AppError {
  constructor(
    message = "Unauthorized",
    details = null,
    errorCode = ErrorCodes.UNAUTHORIZED
  ) {
    super(message, 401, details, errorCode);
  }
}

/**
 * Error for resource conflicts (409)
 * @class ConflictError
 * @extends AppError
 */
class ConflictError extends AppError {
  constructor(
    message = "Resource conflict",
    details = null,
    errorCode = ErrorCodes.CONFLICT
  ) {
    super(message, 409, details, errorCode);
  }
}

/**
 * Error for rate limiting scenarios (429)
 * @class RateLimitError
 * @extends AppError
 */
class RateLimitError extends AppError {
  constructor(
    message = "Rate limit exceeded",
    details = null,
    errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED
  ) {
    super(message, 429, details, errorCode);
  }
}

/**
 * Error for forbidden access scenarios (403)
 * @class ForbiddenError
 * @extends AppError
 */
class ForbiddenError extends AppError {
  constructor(
    message = "Forbidden access",
    details = null,
    errorCode = ErrorCodes.FORBIDDEN
  ) {
    super(message, 403, details, errorCode);
  }
}

/**
 * Error for service unavailable scenarios (503)
 * @class ServiceUnavailableError
 * @extends AppError
 */
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
