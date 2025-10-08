class DomainError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.isDomainError = true;
  }
}

class ValidationError extends DomainError {
  constructor(message, context = {}) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

class BusinessRuleViolationError extends DomainError {
  constructor(message, context = {}) {
    super(message, 'BUSINESS_RULE_VIOLATION', context);
  }
}

class RequiredFieldError extends ValidationError {
  constructor(fieldName, context = {}) {
    super(`Campo requerido: ${fieldName}`, { field: fieldName, ...context });
  }
}

class InvalidFormatError extends ValidationError {
  constructor(fieldName, expectedFormat, context = {}) {
    super(`Formato inválido para ${fieldName}. Se esperaba: ${expectedFormat}`, 
          { field: fieldName, expectedFormat, ...context });
  }
}

module.exports = {
  DomainError,
  ValidationError,
  BusinessRuleViolationError,
  RequiredFieldError,
  InvalidFormatError
};