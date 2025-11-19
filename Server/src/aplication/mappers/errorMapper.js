/**
 * Error mapping utility for transforming domain errors to application errors
 * @class ErrorMapper
 * @description Handles conversion between domain layer errors and application layer errors with proper formatting
 */
class ErrorMapper {
  /**
   * Creates a new ErrorMapper instance
   * @constructor
   * @param {ErrorFactory} errorFactory - Error factory for creating application errors
   */
  constructor(errorFactory) {
    this.errorFactory = errorFactory;
  }

  /**
   * Maps domain error to corresponding application error with formatted message
   * @param {DomainError} domainError - Domain layer error to map
   * @returns {AppError} Corresponding application layer error
   */
  mapDomainErrorToApplicationError(domainError) {
    if (!domainError.isDomainError) {
      return domainError;
    }

    const { message, code, context } = domainError;

    switch (code) {
      case "VALIDATION_ERROR":
        return this.errorFactory.createValidationError(
          this._formatValidationMessage(message, context),
          context
        );

      case "BUSINESS_RULE_VIOLATION":
        return this.errorFactory.createConflictError(
          this._formatBusinessRuleMessage(message, context),
          context
        );

      case "REQUIRED_FIELD":
        return this.errorFactory.createValidationError(
          this._formatRequiredFieldMessage(message, context),
          context
        );

      case "INVALID_FORMAT":
      case "INVALID_EMAIL":
      case "INVALID_DATE":
        return this.errorFactory.createValidationError(
          this._formatInvalidFormatMessage(message, context),
          context
        );

      default:
        return this.errorFactory.createValidationError(message, context);
    }
  }

  /**
   * Formats validation error message with entity and field context
   * @private
   * @param {string} message - Original error message
   * @param {Object} context - Error context information
   * @param {string} [context.entity] - Entity name where error occurred
   * @param {string} [context.field] - Field name that caused error
   * @returns {string} Formatted validation error message
   */
  _formatValidationMessage(message, context) {
    const { entity, field } = context;

    if (entity && field) {
      return message.toLowerCase();
    }

    return message;
  }

  /**
   * Formats business rule violation error message
   * @private
   * @param {string} message - Original error message
   * @param {Object} context - Error context information
   * @param {string} [context.entity] - Entity name where violation occurred
   * @returns {string} Formatted business rule error message
   */
  _formatBusinessRuleMessage(message, context) {
    const { entity } = context;

    if (entity) {
      return `No se puede completar la operación en ${entity}: ${message}`;
    }

    return `No se puede completar la operación: ${message}`;
  }

  /**
   * Formats required field error message with missing fields information
   * @private
   * @param {string} message - Original error message
   * @param {Object} context - Error context information
   * @param {string} [context.entity] - Entity name
   * @param {string} [context.field] - Field name
   * @param {Array} [context.missingFields] - Array of missing field names
   * @returns {string} Formatted required field error message
   */
  _formatRequiredFieldMessage(message, context) {
    const { entity, field, missingFields } = context;

    if (missingFields && missingFields.length > 0) {
      const fields = missingFields.join(", ");
      return `Los siguientes campos son requeridos: ${fields}`;
    }

    if (entity && field) {
      return `El campo '${field}' es requerido en ${entity}`;
    }

    return message;
  }

  /**
   * Formats invalid format error message with expected format details
   * @private
   * @param {string} message - Original error message
   * @param {Object} context - Error context information
   * @param {string} [context.entity] - Entity name
   * @param {string} [context.field] - Field name
   * @param {string} [context.expectedFormat] - Expected format description
   * @param {*} [context.value] - Invalid value that caused error
   * @returns {string} Formatted invalid format error message
   */
  _formatInvalidFormatMessage(message, context) {
    const { entity, field, expectedFormat, value } = context;

    if (entity && field && expectedFormat) {
      return `El campo '${field}' en ${entity} tiene un formato inválido. Se esperaba: ${expectedFormat}`;
    }

    if (field && expectedFormat) {
      return `El campo '${field}' tiene un formato inválido. Se esperaba: ${expectedFormat}`;
    }

    return message;
  }

  /**
   * Executes async operation with automatic domain error mapping
   * @param {Function} operation - Async operation to execute
   * @returns {Promise<*>} Operation result
   * @throws {AppError} Mapped application error if domain error occurs
   */
  async executeWithErrorMapping(operation) {
    try {
      return await operation();
    } catch (error) {
      if (error.isDomainError) {
        throw this.mapDomainErrorToApplicationError(error);
      }
      throw error;
    }
  }

  /**
   * Executes sync operation with automatic domain error mapping
   * @param {Function} operation - Sync operation to execute
   * @returns {*} Operation result
   * @throws {AppError} Mapped application error if domain error occurs
   */
  executeWithErrorMappingSync(operation) {
    try {
      return operation();
    } catch (error) {
      if (error.isDomainError) {
        throw this.mapDomainErrorToApplicationError(error);
      }
      throw error;
    }
  }

  /**
   * Maps array of domain errors to application errors
   * @param {Array<DomainError>} domainErrors - Array of domain errors to map
   * @returns {Array<AppError>} Array of mapped application errors
   */
  mapDomainErrors(domainErrors) {
    return domainErrors.map((error) =>
      this.mapDomainErrorToApplicationError(error)
    );
  }

  /**
   * Checks if error is a domain error
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is a domain error
   */
  isDomainError(error) {
    return error && error.isDomainError === true;
  }

  /**
   * Extracts domain error type information
   * @param {Error} error - Error to analyze
   * @returns {Object|null} Domain error type information or null if not domain error
   */
  getDomainErrorType(error) {
    if (!this.isDomainError(error)) return null;

    return {
      code: error.code,
      name: error.name,
      context: error.context,
    };
  }
}

module.exports = ErrorMapper;
