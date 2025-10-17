class Validator {
  constructor(errorFactory) {
    this.errorFactory = errorFactory;
  }

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

  validateText(value, fieldName, options = {}) {
    const {
      minLength,
      maxLength,
      required = true,
      trim = true,
      pattern,
      patternDescription
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
          minRequired: minLength 
        }
      );
    }

    if (maxLength !== undefined && textValue.length > maxLength) {
      throw this.errorFactory.createValidationError(
        `${fieldName} no puede exceder ${maxLength} caracteres`,
        { 
          field: fieldName, 
          currentLength: textValue.length,
          maxAllowed: maxLength 
        }
      );
    }

    if (pattern && !pattern.test(textValue)) {
      throw this.errorFactory.createValidationError(
        `${fieldName} tiene un formato inválido. ${patternDescription || "No cumple con el patrón requerido"}`,
        { 
          field: fieldName,
          patternDescription: patternDescription 
        }
      );
    }

    return textValue;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Validator;
