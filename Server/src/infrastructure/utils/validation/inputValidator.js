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
