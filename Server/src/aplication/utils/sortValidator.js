const SORT_CONSTANTS = require("../../infrastructure/constants/sortConstants");

/**
 * Sort parameter validator for preventing SQL injection and ensuring valid sort operations
 * @class SortValidator
 * @description Validates and normalizes sort parameters against predefined allowed fields
 */
class SortValidator {
  /**
   * Creates a new SortValidator instance
   * @constructor
   * @param {Object} dependencies - Validator dependencies
   * @param {ErrorFactory} dependencies.errorFactory - Error factory for creating validation errors
   */
  constructor({ errorFactory }) {
    this.errorFactory = errorFactory;
  }

  /**
   * Validates and normalizes sort parameters for a specific entity
   * @param {string} entity - Entity name to validate sort parameters for
   * @param {Object} [options={}] - Sort parameters to validate
   * @param {string} [options.sortBy] - Field to sort by
   * @param {string} [options.sortOrder] - Sort order direction
   * @returns {Object} Normalized sort parameters
   * @returns {string} return.sortBy - Validated sort field
   * @returns {string} return.sortOrder - Validated sort order
   * @throws {ValidationError} When entity is invalid or sort parameters are not allowed
   */
  validateAndNormalizeSortParams(entity, options = {}) {
    const entityConfig = SORT_CONSTANTS.ENTITIES[entity];
    if (!entityConfig) {
      throw this.errorFactory.createValidationError(
        `Invalid entity for sort validation: ${entity}. Valid entities: ${Object.keys(
          SORT_CONSTANTS.ENTITIES
        ).join(", ")}`
      );
    }
    const { FIELDS, DEFAULTS } = entityConfig;

    const { sortBy = DEFAULTS.SORT_BY, sortOrder = DEFAULTS.SORT_ORDER } =
      options;

    const allowedFields = Object.values(FIELDS);
    if (!allowedFields.includes(sortBy)) {
      throw this.errorFactory.createValidationError(
        `Campo de ordenamiento inválido para ${entity}: ${sortBy}`,
        {
          allowedSortsValue: allowedFields,
        }
      );
    }

    const allowedOrders = Object.values(SORT_CONSTANTS.SORT_ORDER);
    if (!allowedOrders.includes(sortOrder.toLowerCase())) {
      throw this.errorFactory.createValidationError(
        `Valor de ordenamiento erroneo: ${sortOrder}`,
        {
          allowedOrders: allowedOrders,
        }
      );
    }

    return {
      sortBy,
      sortOrder: sortOrder.toLowerCase(),
    };
  }

  /**
   * Gets all allowed sort fields for a specific entity
   * @param {string} entity - Entity name to get fields for
   * @returns {Object|null} Object containing allowed sort fields or null if entity not found
   */
  getAllowedFieldsFor(entity) {
    return SORT_CONSTANTS.ENTITIES[entity]?.FIELDS;
  }

  /**
   * Gets default sort settings for a specific entity
   * @param {string} entity - Entity name to get defaults for
   * @returns {Object|null} Default sort settings or null if entity not found
   */
  getDefaultFor(entity) {
    return SORT_CONSTANTS.ENTITIES[entity]?.DEFAULTS;
  }
}

module.exports = SortValidator;
