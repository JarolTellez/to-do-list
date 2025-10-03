const { SORT_FIELD_MAPPINGS, SORT_ORDER } = require("../../constants/sortConstants");

class InputValidator {
  constructor({errorFactory}) {
    this.errorFactory = errorFactory;
  }

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

module.exports = InputValidator;
