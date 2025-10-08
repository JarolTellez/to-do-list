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
    ErrorCodes,
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
      AppError,
    };

    this.ErrorCodes = ErrorCodes;
  }

  createNotFoundError(
    message = "Resource not found",
    details = null,
    errorCode = this.ErrorCodes.NOT_FOUND
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.NotFoundError(message, enrichedDetails, errorCode);
  }

  createValidationError(
    message = "Invalid data",
    details = null,
    errorCode = this.ErrorCodes.VALIDATION_ERROR
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ValidationError(message, enrichedDetails, errorCode);
  }

  createDatabaseError(
    message = "Database error",
    details = null,
    errorCode = this.ErrorCodes.DATABASE_ERROR
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.DatabaseError(message, enrichedDetails, errorCode);
  }

  createAuthenticationError(
    message = "Unauthorized",
    details = null,
    errorCode = this.ErrorCodes.UNAUTHORIZED
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.AuthenticationError(
      message,
      enrichedDetails,
      errorCode
    );
  }

  createForbiddenError(
    message = "Forbidden access",
    details = null,
    errorCode = this.ErrorCodes.FORBIDDEN
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ForbiddenError(message, enrichedDetails, errorCode);
  }

  createConflictError(
    message = "Resource conflict",
    details = null,
    errorCode = this.ErrorCodes.CONFLICT
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ConflictError(message, enrichedDetails, errorCode);
  }

  createRateLimitError(
    message = "Rate limit exceeded",
    details = null,
    errorCode = this.ErrorCodes.RATE_LIMIT_EXCEEDED
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.RateLimitError(message, enrichedDetails, errorCode);
  }

  createServiceUnavailableError(
    message = "Service unavailable",
    details = null,
    errorCode = this.ErrorCodes.SERVICE_UNAVAILABLE
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ServiceUnavailableError(
      message,
      enrichedDetails,
      errorCode
    );
  }

  #enrichDetails(details) {
    const timestamp = new Date().toISOString();

    if (details === null || typeof details !== "object") {
      return { timestamp };
    }

    return {
      ...details,
      timestamp,
    };
  }
}

module.exports = ErrorFactory;
