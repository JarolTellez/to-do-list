class DomainValidators {
  constructor(errorFactory) {
    this.errorFactory = errorFactory;
    this.codes = errorFactory.ErrorCodes;
  }

  validateId(id, entityName = "entity") {
    if (id !== null && typeof id !== "number" && typeof id !== "string") {
      throw this.error.createValidationError(
        `${entityName} ID must be number or string`,
        { type: typeof id },
        this.codes.INVALID_FORMAT
      );
    }

    if (id !== null && String(id).trim() === "") {
      throw this.errorFactory.createValidationError(
        `${entityName} ID cannot be empty`,
        null,
        this.codes.INVALID_FORMAT
      );
    }

    return id;
  }

  validateText(value, fieldName, options = {}) {
    const {
      min = 0,
      max = Infinity,
      required = false,
      entity = "entity",
    } = options;

    if (required && (!value || String(value).trim() === "")) {
      throw this.errorFactory.createValidationError(
        `${fieldName} is required`,
        { field: fieldName },
        this.codes.REQUIRED_FIELD
      );
    }

    if (!required && value == null) return value;
    if (typeof value !== "string") {
      throw this.errorFactory.createValidationError(
        `${fieldName} must be text`,
        { field: fieldName, type: typeof value },
        this.codes.INVALID_FORMAT
      );
    }

    const text = value.trim();
    const length = text.length;

    if (length < min) {
      throw this.errorFactory.createValidationError(
        `${fieldName} too short (min ${min} chars)`,
        { field: fieldName, length, min },
        this.codes.INVALID_FORMAT
      );
    }

    if (length > max) {
      throw this.errorFactory.createValidationError(
        `${fieldName} too long (max ${max} chars)`,
        { field: fieldName, length, max },
        this.codes.INVALID_FORMAT
      );
    }

    return text;
  }

  validateEnum(value, fieldName, allowed, entity = "entity") {
    if (!allowed.includes(value)) {
      throw this.errorFactory.createValidationError(
        `${fieldName} must be: ${allowed.join(", ")}`,
        { field: fieldName, value, allowed },
        this.codes.INVALID_FORMAT
      );
    }
    return value;
  }

  validateDate(date, fieldName, options = {}) {
    const { required = false } = options;

    if (required && !date) {
      throw this.errorFactory.createValidationError(
        `${fieldName} is required`,
        { field: fieldName },
        this.codes.REQUIRED_FIELD
      );
    }

    if (!required && !date) return null;

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw this.errorFactory.createValidationError(
        `${fieldName} must be valid date`,
        { field: fieldName, value: date },
        this.codes.INVALID_DATE
      );
    }

    return dateObj;
  }

  validateBoolean(value, fieldName, entity = "entity") {
     if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const valLower = value.toLowerCase().trim();
    if (valLower === "true" || valLower === "1") return true;
    if (valLower === "false" || valLower === "0") return false;
  }


  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  throw this.errorFactory.createValidationError(
    `${fieldName} must be a boolean (true/false, "0"/"1", 0/1)`,
    { field: fieldName, value, type: typeof value },
    this.codes.INVALID_BOOLEAN
  );
  }

  validateCollection(collection, fieldName, entity = "entity") {
    if (!Array.isArray(collection)) {
      throw this.errorFactory.createValidationError(
        `${fieldName} must be an array`,
        { field: fieldName, type: typeof collection },
        this.codes.INVALID_FORMAT
      );
    }
    return [...collection];
  }
}

module.exports = DomainValidators;
