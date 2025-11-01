const {
  DomainError,
  ValidationError,
  BusinessRuleViolationError,
  RequiredFieldError,
  InvalidFormatError
} = require('../../domain/errors/domainError');

class ErrorMapper {
  constructor(errorFactory) {
    this.errorFactory = errorFactory;
  }

  /**
   * Map from domain error to appError
   */
  mapDomainErrorToApplicationError(domainError) {
    if (!domainError.isDomainError) {
      return domainError;
    }

    const { message, code, context } = domainError;

    switch (code) {
      case 'VALIDATION_ERROR':
        return this.errorFactory.createValidationError(
          this._formatValidationMessage(message, context),
          context
        );

      case 'BUSINESS_RULE_VIOLATION':
        return this.errorFactory.createConflictError(
          this._formatBusinessRuleMessage(message, context),
          context
        );

      case 'REQUIRED_FIELD':
        return this.errorFactory.createValidationError(
          this._formatRequiredFieldMessage(message, context),
          context
        );

      case 'INVALID_FORMAT':
      case 'INVALID_EMAIL':
      case 'INVALID_DATE':
        return this.errorFactory.createValidationError(
          this._formatInvalidFormatMessage(message, context),
          context
        );

      default:
        return this.errorFactory.createValidationError(
          message,
          context
        );
    }
  }


  _formatValidationMessage(message, context) {
    const { entity, field } = context;
    
    if (entity && field) {
      return  message.toLowerCase();
    }
    
    return message;
  }


  _formatBusinessRuleMessage(message, context) {
    const { entity } = context;
    
    if (entity) {
      return `No se puede completar la operación en ${entity}: ${message}`;
    }
    
    return `No se puede completar la operación: ${message}`;
  }

  _formatRequiredFieldMessage(message, context) {
    const { entity, field, missingFields } = context;
    
    if (missingFields && missingFields.length > 0) {
      const fields = missingFields.join(', ');
      return `Los siguientes campos son requeridos: ${fields}`;
    }
    
    if (entity && field) {
      return `El campo '${field}' es requerido en ${entity}`;
    }
    
    return message;
  }


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


  mapDomainErrors(domainErrors) {
    return domainErrors.map(error => 
      this.mapDomainErrorToApplicationError(error)
    );
  }

  isDomainError(error) {
    return error && error.isDomainError === true;
  }

 
  getDomainErrorType(error) {
    if (!this.isDomainError(error)) return null;
    
    return {
      code: error.code,
      name: error.name,
      context: error.context
    };
  }
}

module.exports = ErrorMapper;