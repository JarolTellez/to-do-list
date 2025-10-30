/**
 * Factory class for creating standardized application errors
 * @class ErrorFactory
 */
class ErrorFactory {
  /**
   * Creates a new ErrorFactory instance
   * @param {Object} dependencies - Error classes and codes dependencies
   * @param {class} dependencies.NotFoundError - Not found error class
   * @param {class} dependencies.ValidationError - Validation error class
   * @param {class} dependencies.DatabaseError - Database error class
   * @param {class} dependencies.AuthenticationError - Authentication error class
   * @param {class} dependencies.ConflictError - Conflict error class
   * @param {class} dependencies.RateLimitError - Rate limit error class
   * @param {class} dependencies.ForbiddenError - Forbidden error class
   * @param {class} dependencies.ServiceUnavailableError - Service unavailable error class
   * @param {class} dependencies.AppError - Base application error class
   * @param {Object} dependencies.ErrorCodes - Error codes constants
   */
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

  /**
   * Creates a Not Found error
   * @param {string} [message="Resource not found"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.NOT_FOUND] - Error code
   * @returns {NotFoundError} Configured Not Found error instance
   */
  createNotFoundError(
    message = "Resource not found",
    details = null,
    errorCode = this.ErrorCodes.NOT_FOUND
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.NotFoundError(message, enrichedDetails, errorCode);
  }

  /**
   * Creates a Validation error
   * @param {string} [message="Invalid data"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.VALIDATION_ERROR] - Error code
   * @returns {ValidationError} Configured Validation error instance
   */
  createValidationError(
    message = "Invalid data",
    details = null,
    errorCode = this.ErrorCodes.VALIDATION_ERROR
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ValidationError(message, enrichedDetails, errorCode);
  }

  /**
   * Creates a Database error
   * @param {string} [message="Database error"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.DATABASE_ERROR] - Error code
   * @returns {DatabaseError} Configured Database error instance
   */
  createDatabaseError(
    message = "Database error",
    details = null,
    errorCode = this.ErrorCodes.DATABASE_ERROR
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.DatabaseError(message, enrichedDetails, errorCode);
  }

  /**
   * Creates an Authentication error
   * @param {string} [message="Unauthorized"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.UNAUTHORIZED] - Error code
   * @returns {AuthenticationError} Configured Authentication error instance
   */
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

  /**
   * Creates a Forbidden error
   * @param {string} [message="Forbidden access"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.FORBIDDEN] - Error code
   * @returns {ForbiddenError} Configured Forbidden error instance
   */
  createForbiddenError(
    message = "Forbidden access",
    details = null,
    errorCode = this.ErrorCodes.FORBIDDEN
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ForbiddenError(message, enrichedDetails, errorCode);
  }

  /**
   * Creates a Conflict error
   * @param {string} [message="Resource conflict"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.CONFLICT] - Error code
   * @returns {ConflictError} Configured Conflict error instance
   */
  createConflictError(
    message = "Resource conflict",
    details = null,
    errorCode = this.ErrorCodes.CONFLICT
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.ConflictError(message, enrichedDetails, errorCode);
  }

  /**
   * Creates a Rate Limit error
   * @param {string} [message="Rate limit exceeded"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.RATE_LIMIT_EXCEEDED] - Error code
   * @returns {RateLimitError} Configured Rate Limit error instance
   */
  createRateLimitError(
    message = "Rate limit exceeded",
    details = null,
    errorCode = this.ErrorCodes.RATE_LIMIT_EXCEEDED
  ) {
    const enrichedDetails = this.#enrichDetails(details);
    return new this.Errors.RateLimitError(message, enrichedDetails, errorCode);
  }

  /**
   * Creates a Service Unavailable error
   * @param {string} [message="Service unavailable"] - Error message
   * @param {Object} [details=null] - Additional error details
   * @param {string} [errorCode=this.ErrorCodes.SERVICE_UNAVAILABLE] - Error code
   * @returns {ServiceUnavailableError} Configured Service Unavailable error instance
   */
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

  /**
   * Enriches error details with timestamp
   * @private
   * @param {Object} details - Original error details
   * @returns {Object} Enriched error details with timestamp
   */
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
