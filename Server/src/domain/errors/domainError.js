/**
 * Base domain error class for handling business logic errors with consistent structure
 * @class DomainError
 * @extends Error
 */
class DomainError extends Error {
  /**
   * Creates a new DomainError instance
   * @param {string} message - Error description message
   * @param {string} code - Unique error code for error identification
   * @param {Object} [context={}] - Additional context data for error debugging
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.isDomainError = true;
  }
}

/**
 * Validation error for data format and structure violations
 * @class ValidationError
 * @extends DomainError
 */
class ValidationError extends DomainError {
  constructor(message, context = {}) {
    super(message, "VALIDATION_ERROR", context);
  }
}

/**
 * Business rule violation error for domain logic breaches
 * @class BusinessRuleViolationError
 * @extends DomainError
 */
class BusinessRuleViolationError extends DomainError {
  constructor(message, context = {}) {
    super(message, "BUSINESS_RULE_VIOLATION", context);
  }
}

/**
 * Specific validation error for missing required fields
 * @class RequiredFieldError
 * @extends ValidationError
 */
class RequiredFieldError extends ValidationError {
  constructor(fieldName, context = {}) {
    super(`Campo requerido: ${fieldName}`, { field: fieldName, ...context });
  }
}

/**
 * Specific validation error for invalid data formats
 * @class InvalidFormatError
 * @extends ValidationError
 */
class InvalidFormatError extends ValidationError {
  constructor(fieldName, expectedFormat, context = {}) {
    super(
      `Formato inválido para ${fieldName}. Se esperaba: ${expectedFormat}`,
      { field: fieldName, expectedFormat, ...context }
    );
  }
}

module.exports = {
  DomainError,
  ValidationError,
  BusinessRuleViolationError,
  RequiredFieldError,
  InvalidFormatError,
};
