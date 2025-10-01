class ErrorFactory {
  constructor({
    NotFoundError,
    ValidationError,
    DatabaseError,
    AuthenticationError,
    ConflictError,
    RateLimitError,
    ForbiddenError,
    ServiceUnavailableError,
    AppError,
    ErrorCodes
  }) {
    this.Errors = {
      NotFoundError,
      ValidationError,
      DatabaseError,
      AuthenticationError,
      ConflictError,
      RateLimitError,
      ForbiddenError,
      ServiceUnavailableError,
      AppError
    };
    
    this.ErrorCodes = ErrorCodes;
  }


  createNotFoundError(message = "Resource not found", details = null, errorCode = this.ErrorCodes.NOT_FOUND) {
    return new this.Errors.NotFoundError(message, details, errorCode);
  }

  createValidationError(message = "Invalid data", details = null, errorCode = this.ErrorCodes.VALIDATION_ERROR) {
    return new this.Errors.ValidationError(message, details, errorCode);
  }

  createDatabaseError(message = "Database error", details = null, errorCode = this.ErrorCodes.DATABASE_ERROR) {
    return new this.Errors.DatabaseError(message, details, errorCode);
  }


  createAuthenticationError(message = "Unauthorized", details = null, errorCode = this.ErrorCodes.UNAUTHORIZED) {
    return new this.Errors.AuthenticationError(message, details, errorCode);
  }

  createForbiddenError(message = "Forbidden access", details = null, errorCode = this.ErrorCodes.FORBIDDEN) {
    return new this.Errors.ForbiddenError(message, details, errorCode);
  }

  createConflictError(message = "Resource conflict", details = null, errorCode = this.ErrorCodes.CONFLICT) {
    return new this.Errors.ConflictError(message, details, errorCode);
  }

  createRateLimitError(message = "Rate limit exceeded", details = null, errorCode = this.ErrorCodes.RATE_LIMIT_EXCEEDED) {
    return new this.Errors.RateLimitError(message, details, errorCode);
  }

  createServiceUnavailableError(message = "Service unavailable", details = null, errorCode = this.ErrorCodes.SERVICE_UNAVAILABLE) {
    return new this.Errors.ServiceUnavailableError(message, details, errorCode);
  }

}

module.exports = ErrorFactory;