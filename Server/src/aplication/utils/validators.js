/**
 * Generic validator for application layer data validation
 * @class Validator
 * @description Provides common validation methods for request data and parameters.
 */
class Validator {
  /**
   * Creates a new Validator instance
   * @constructor
   * @param {ErrorFactory} errorFactory - Error factory for creating validation errors
   */
  constructor(errorFactory) {
    this.errorFactory = errorFactory;
  }

  /**
   * Validates that all required fields are present and non-empty in an object
   * @param {Array<string>} fields - Array of field names to validate
   * @param {Object} object - Object containing the fields to check
   * @throws {ValidationError} When one or more required fields are missing or empty
   */
  validateRequired(fields, object) {
    const missing = [];
    const details = {};

    fields.forEach((field) => {
      if (!object[field] || object[field].toString().trim() === "") {
        missing.push(field);
        details[field] = "Required field";
      }
    });

    if (missing.length > 0) {
      throw this.errorFactory.createValidationError(
        `Campos requeridos faltantes: ${missing.join(", ")}`,
        { missingFields: details }
      );
    }
  }

  /**
   * Validates text fields with comprehensive constraints
   * @param {string} value - Text value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @param {Object} [options={}] - Validation options
   * @param {number} [options.minLength] - Minimum length requirement
   * @param {number} [options.maxLength] - Maximum length requirement
   * @param {boolean} [options.required=true] - Whether field is required
   * @param {boolean} [options.trim=true] - Whether to trim whitespace
   * @param {RegExp} [options.pattern] - Regex pattern for format validation
   * @param {string} [options.patternDescription] - Description of expected pattern
   * @returns {string} Validated and potentially trimmed text value
   * @throws {ValidationError} When validation constraints are not met
   */
  validateText(value, fieldName, options = {}) {
    const {
      minLength,
      maxLength,
      required = true,
      trim = true,
      pattern,
      patternDescription,
    } = options;

    if (required && (!value || value.toString().trim() === "")) {
      throw this.errorFactory.createValidationError(
        `${fieldName} es requerido`,
        { field: fieldName, reason: "required" }
      );
    }

    if (!value && !required) {
      return value;
    }

    const textValue = trim ? value.toString().trim() : value.toString();

    if (minLength !== undefined && textValue.length < minLength) {
      throw this.errorFactory.createValidationError(
        `${fieldName} debe tener al menos ${minLength} caracteres`,
        {
          field: fieldName,
          currentLength: textValue.length,
          minRequired: minLength,
        }
      );
    }

    if (maxLength !== undefined && textValue.length > maxLength) {
      throw this.errorFactory.createValidationError(
        `${fieldName} no puede exceder ${maxLength} caracteres`,
        {
          field: fieldName,
          currentLength: textValue.length,
          maxAllowed: maxLength,
        }
      );
    }

    if (pattern && !pattern.test(textValue)) {
      throw this.errorFactory.createValidationError(
        `${fieldName} tiene un formato inválido. ${
          patternDescription || "No cumple con el patrón requerido"
        }`,
        {
          field: fieldName,
          patternDescription: patternDescription,
        }
      );
    }

    return textValue;
  }

  /**
   * Validates email format using standard email regex
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email format is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Validator;
