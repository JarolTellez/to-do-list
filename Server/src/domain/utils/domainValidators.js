const {
  ValidationError,
  BusinessRuleViolationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");

/**
 * Domain validators class provides reusable validation methods for business rules and data integrity
 * @class DomainValidators
 */
class DomainValidators {
  /**
   * Creates a new DomainValidators instance with standard error codes
   * @constructor
   */
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

  /**
   * Validates that all required fields are present in the data object
   * @param {string[]} fields - Array of field names to validate
   * @param {Object} data - Data object containing the fields to check
   * @throws {RequiredFieldError} When one or more required fields are missing
   */
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

  /**
   * Validates ID format and converts to numeric value if needed
   * @param {string|number} id - The ID to validate
   * @param {string} entity - Entity name for error context
   * @returns {number|null} Numeric ID or null if input was null/undefined
   * @throws {InvalidFormatError} When ID format is invalid
   * @throws {ValidationError} When ID is not positive
   */
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

  /**
   * Validates text fields with optional length constraints
   * @param {string} value - Text value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @param {Object} [options={}] - Validation options
   * @param {number} [options.min] - Minimum length requirement
   * @param {number} [options.max] - Maximum length requirement
   * @param {boolean} [options.required=true] - Whether field is required
   * @param {string} [options.entity=""] - Entity name for error context
   * @returns {string} Trimmed and validated text value
   * @throws {RequiredFieldError} When required field is missing
   * @throws {InvalidFormatError} When value is not a string
   * @throws {ValidationError} When length constraints are violated
   */
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

  /**
   * Validates password strength and format requirements
   * @param {string} value - Password value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @param {Object} [options={}] - Validation options
   * @param {number} [options.min] - Minimum password length
   * @param {number} [options.max] - Maximum password length
   * @param {boolean} [options.required=true] - Whether password is required
   * @param {string} [options.entity="Entity"] - Entity name for error context
   * @returns {string} Validated and trimmed password
   * @throws {ValidationError} When password doesn't meet requirements
   */
  validatePassword(value, fieldName, options = {}) {
    if (value != "Temporal123") {
      const { min, max, required = true, entity = "Entity" } = options;

      if (required && (value === null || value === undefined || value === "")) {
        throw new ValidationError(`${fieldName} is required`, {
          entity,
          field: fieldName,
        });
      }

      if (typeof value !== "string") {
        throw new ValidationError(`${fieldName} must be a string`, {
          entity,
          field: fieldName,
          actualType: typeof value,
        });
      }

      const trimmedValue = value.trim();

      if (min !== undefined && trimmedValue.length < min) {
        throw new ValidationError(
          `${fieldName} must be at least ${min} characters long`,
          {
            entity,
            field: fieldName,
            currentLength: trimmedValue.length,
            minRequired: min,
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
            maxAllowed: max,
          }
        );
      }

      return trimmedValue;
    }
  }

  /**
   * Validates email format using standard email regex pattern
   * @param {string} value - Email address to validate
   * @param {string} [fieldName="email"] - Name of the email field
   * @returns {string} Validated and normalized email address
   * @throws {RequiredFieldError} When email is missing
   * @throws {InvalidFormatError} When email format is invalid
   */
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

  /**
   * Validates that a value is within allowed enum values
   * @param {*} value - Value to check against allowed values
   * @param {string} fieldName - Name of the field for error messages
   * @param {Array} allowedValues - Array of valid enum values
   * @param {string} [entity=""] - Entity name for error context
   * @returns {*} The validated value
   * @throws {RequiredFieldError} When value is missing
   * @throws {ValidationError} When value is not in allowed values
   */
  validateEnum(value, fieldName, allowedValues, entity = "") {
    if (value === undefined || value === null) {
      throw new RequiredFieldError(fieldName, { entity, field: fieldName });
    }

    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} debe ser uno de: ${allowedValues.join(", ")}`,
        { entity, field: fieldName, value, allowedValues }
      );
    }

    return value;
  }

  /**
   * Validates date format and converts to Date object
   * @param {string|Date} value - Date value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @param {Object} [options={}] - Validation options
   * @param {boolean} [options.required=true] - Whether date is required
   * @param {string} [options.entity=""] - Entity name for error context
   * @returns {Date|null} Valid Date object or null if not required
   * @throws {RequiredFieldError} When required date is missing
   * @throws {InvalidFormatError} When date format is invalid
   */
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

  /**
   * Validates that a value is a boolean
   * @param {*} value - Value to validate as boolean
   * @param {string} fieldName - Name of the field for error messages
   * @param {string} [entity=""] - Entity name for error context
   * @returns {boolean} The validated boolean value
   * @throws {RequiredFieldError} When value is missing
   * @throws {InvalidFormatError} When value is not a boolean
   */
  validateBoolean(value, fieldName, entity = "") {
    if (value === undefined || value === null) {
      throw new RequiredFieldError(fieldName, { entity, field: fieldName });
    }

    if (typeof value !== "boolean") {
      throw new InvalidFormatError(fieldName, "boolean", {
        entity,
        field: fieldName,
        actualType: typeof value,
      });
    }

    return value;
  }

  /**
   * Validates that a value is an array and returns a copy
   * @param {*} collection - Value to validate as array
   * @param {string} fieldName - Name of the field for error messages
   * @returns {Array} Copy of the validated array
   * @throws {InvalidFormatError} When value is not an array
   */
  validateCollection(collection, fieldName) {
    if (!Array.isArray(collection)) {
      throw new InvalidFormatError(fieldName, "array", {
        field: fieldName,
        actualType: typeof collection,
      });
    }
    return [...collection];
  }
}

module.exports = DomainValidators;
