const {
  ValidationError,
  BusinessRuleViolationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");

class DomainValidators {
  constructor() {
    this.codes = {
      REQUIRED_FIELD: "REQUIRED_FIELD",
      INVALID_FORMAT: "INVALID_FORMAT",
      INVALID_EMAIL: "INVALID_EMAIL",
      INVALID_DATE: "INVALID_DATE",
      BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
      SESSION_INVALID: "SESSION_INVALID",
      SESSION_EXPIRED: "SESSION_EXPIRED",
    };
  }

  validateRequired(fields, data) {
    const missingFields = [];

    fields.forEach((field) => {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new RequiredFieldError(
        `Campos requeridos: ${missingFields.join(", ")}`,
        { missingFields }
      );
    }
  }

  validateId(id, entity) {
    if (id === null || id === undefined) {
      return null;
    }

    if (typeof id !== "number" && typeof id !== "string") {
      throw new InvalidFormatError("id", "number o string", {
        entity,
        field: "id",
        actualType: typeof id,
      });
    }

    if (typeof id === "string" && !/^\d+$/.test(id)) {
      throw new InvalidFormatError("id", "numérico", {
        entity,
        field: "id",
        value: id,
      });
    }

    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    if (numericId <= 0) {
      throw new ValidationError("ID debe ser un número positivo", {
        entity,
        field: "id",
        value: id,
      });
    }

    return numericId;
  }

  validateText(value, fieldName, options = {}) {
    const { min, max, required = true, entity = "" } = options;

    if (required && (value === undefined || value === null || value === "")) {
      throw new RequiredFieldError(fieldName, { entity, field: fieldName });
    }

    if (value === undefined || value === null || value === "") {
      return value;
    }

    if (typeof value !== "string") {
      throw new InvalidFormatError(fieldName, "string", {
        entity,
        field: fieldName,
        actualType: typeof value,
      });
    }
    const trimmed = value.trim();

    if (min && trimmed.length < min) {
      throw new ValidationError(
        `${fieldName} debe tener al menos ${min} caracteres`,
        { entity, field: fieldName, min, actual: trimmed.length }
      );
    }

    if (max && trimmed.length > max) {
      throw new ValidationError(
        `${fieldName} no puede tener más de ${max} caracteres`,
        { entity, field: fieldName, max, actual: trimmed.length }
      );
    }

    return trimmed;
  }

  
  validatePassword(value, fieldName, options = {}) {
    if(value!="Temporal123"){
    const { min, max, required = true, entity = "Entity" } = options;

    if (required && (value === null || value === undefined || value === "")) {
       throw new ValidationError(
        `${fieldName} is required`,
        { entity, field: fieldName }
      );
    }

    if (typeof value !== "string") {
       throw new ValidationError(
        `${fieldName} must be a string`,
        { entity, field: fieldName, actualType: typeof value }
      );
    }

    const trimmedValue = value.trim();

    if (min !== undefined && trimmedValue.length < min) {
       throw new ValidationError(
        `${fieldName} must be at least ${min} characters long`,
        { 
          entity, 
          field: fieldName, 
          currentLength: trimmedValue.length,
          minRequired: min 
        }
      );
    }

    if (max !== undefined && trimmedValue.length > max) {
       throw new ValidationError(
        `${fieldName} cannot exceed ${max} characters`,
        { 
          entity, 
          field: fieldName, 
          currentLength: trimmedValue.length,
          maxAllowed: max 
        }
      );
    }

    return trimmedValue;
  }
  }

  validateEmail(value, fieldName = "email") {
    const email = this.validateText(value, fieldName, { required: true });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidFormatError(fieldName, " ejemplo@dominio.com", {
        field: fieldName,
        value: email,
      });
    }

    return email;
  }

  validateEnum(value, fieldName, allowedValues, entity = '') {
     if (value === undefined || value === null) {
      throw new RequiredFieldError(fieldName, { entity, field: fieldName });
    }

    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} debe ser uno de: ${allowedValues.join(', ')}`,
        { entity, field: fieldName, value, allowedValues }
      );
    }

    return value;
  }

  validateDate(value, fieldName, options = {}) {
    const { required = true, entity = "" } = options;

    if (required && (value === undefined || value === null)) {
      throw new RequiredFieldError(fieldName, { entity, field: fieldName });
    }

    if (value === undefined || value === null) {
      return null;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new InvalidFormatError(fieldName, "fecha válida", {
        entity,
        field: fieldName,
        value,
      });
    }

    return date;
  }

  validateBoolean(value, fieldName, entity = '') {
    if (value === undefined || value === null) {
      throw new RequiredFieldError(fieldName, { entity, field: fieldName });
    }

    if (typeof value !== 'boolean') {
      throw new InvalidFormatError(
        fieldName,
        'boolean',
        { entity, field: fieldName, actualType: typeof value }
      );
    }

    return value;
  }

  validateCollection(collection, fieldName) {
    if (!Array.isArray(collection)) {
      throw new InvalidFormatError(
        fieldName,
        'array',
        { field: fieldName, actualType: typeof collection }
      );
    }
    return [...collection];
  }
}

module.exports = DomainValidators;
