const { SORT_FIELD_MAPPINGS, SORT_ORDER } = require("../../constants/sortConstants");

/**
 * Input validation utility for common data types and formats
 * @class InputValidator
 */
class InputValidator {
  /**
   * Creates a new InputValidator instance
   * @param {Object} dependencies - Dependencies for InputValidator
   * @param {Object} dependencies.errorFactory - Factory for creating validation errors
   */
  constructor({errorFactory}) {
    this.errorFactory = errorFactory;
  }

    /**
   * Validates and normalizes a sort field value
   * @param {string} value - The sort field value to validate
   * @param {Object} validFields - Object containing valid field values
   * @param {string} [fieldName="sort field"] - Name of the field for error messages
   * @returns {Object} Normalized field information
   * @returns {string} return.originalField - Original valid field value
   * @returns {string} return.safeField - Safe field value for database queries
   * @throws {ValidationError} If value is not a string or not in validFields
   */
  validateSortField(value, validFields, fieldName = "sort field") {
  if (typeof value !== "string") {
    throw this.errorFactory.createValidationError(`${fieldName} must be a string`);
  }

  const normalizedValue = value.toLowerCase();
  const validField = Object.values(validFields).find(
    field => field.toLowerCase() === normalizedValue
  );

  if (!validField) {
    throw this.errorFactory.createValidationError(
      `Invalid ${fieldName}. Valid values: ${Object.values(validFields).join(", ")}`
    );
  }

  return {
    originalField: validField,
    safeField: validField, 
  };
}

 /**
   * Validates and normalizes a sort order value
   * @param {string} value - The sort order value to validate
   * @returns {Object} Normalized order information
   * @returns {string} return.originalOrder - Original valid order value
   * @returns {string} return.safeOrder - Safe order value for database queries (ASC/DESC)
   * @throws {ValidationError} If value is not a string or not a valid sort order
   */
  validateSortOrder(value) {
    if (typeof value !== "string") {
      throw this.errorFactory.createValidationError(
        "Sort order must be a string"
      );
    }

    const normalizedValue = value.toLowerCase();
    const validOrder = Object.values(SORT_ORDER).find(
      (order) => order.toLowerCase() === normalizedValue
    );

    if (!validOrder) {
      throw this.errorFactory.createValidationError(
        `Invalid sort order. Valid values: ${Object.values(SORT_ORDER).join(
          ", "
        )}`
      );
    }
    const safeOrder = validOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    return {
      originalOrder: validOrder,
      safeOrder: safeOrder,
    };
  }

   /**
   * Validates and converts an ID to a number
   * @param {number|string} id - The ID to validate
   * @param {string} [fieldName="id"] - Name of the field for error messages
   * @returns {number} Validated ID as a number
   * @throws {ValidationError} If ID is not a positive integer
   */
  validateId(id, fieldName = "id") {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw this.errorFactory.createValidationError(`Invalid ${fieldName}`);
    }
    return idNum;
  }
}

module.exports = InputValidator;
