const { SORT_FIELD_MAPPINGS } = require("../../constants/sortConstants");

class InputValidator {
  constructor(errorFactory) {
    this.errorFactory = errorFactory;
  }

  validateSortField(value, validFields, entityType, fieldName = "sort field") {
    if (typeof value !== "string") {
      throw this.errorFactory.createValidationError(
        `${fieldName} must be a string`
      );
    }

    const normalizedValue = value.toLowerCase();

    const validField = Object.values(validFields).find(
      (field) => field.toLowerCase() === normalizedValue
    );

    if (!validField) {
      throw this.errorFactory.createValidationError(
        `Invalid ${fieldName}. Valid values: ${Object.values(validFields).join(
          ", "
        )}`
      );
    }

    const entityMapping = SORT_FIELD_MAPPINGS[entityType];
    if (!entityMapping) {
      throw this.errorFactory.createValidationError(
        `Invalid entity type: ${entityType}`
      );
    }

    const safeField = entityMapping[validField];
    if (!safeField) {
      throw this.errorFactory.createValidationError(
        `No safe mapping found for field '${validField}' in entity '${entityType}'`
      );
    }

    return {
      originalField: validField,
      safeField: safeField,
    };
  }

  validateSortOrder(value, validOrders) {
    if (typeof value !== "string") {
      throw this.errorFactory.createValidationError(
        "Sort order must be a string"
      );
    }

    const normalizedValue = value.toLowerCase();
    const validOrder = Object.values(validOrders).find(
      (order) => order.toLowerCase() === normalizedValue
    );

    if (!validOrder) {
      throw this.errorFactory.createValidationError(
        `Invalid sort order. Valid values: ${Object.values(validOrders).join(
          ", "
        )}`
      );
    }

    // Convertir a uppercase para SQL
    const safeOrder = validOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    return {
      originalOrder: validOrder,
      safeOrder: safeOrder,
    };
  }

  validateId(id, fieldName = "id") {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw this.errorFactory.createValidationError(`Invalid ${fieldName}`);
    }
    return idNum;
  }
}

module.exports = SortValidator;
