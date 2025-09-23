class Validator {
  constructor(ValidationError) {
    this.ValidationError = ValidationError;
  }

  validateRequired(fields, object) {
    const missing = [];
    const details = {};
    
    fields.forEach(field => {
      if (!object[field] || object[field].toString().trim() === '') {
        missing.push(field);
        details[field] = 'Required field';
      }
    });
    
    if (missing.length > 0) {
      throw new this.ValidationError(
        `Campos requeridos faltantes: ${missing.join(', ')}`,
        { missingFields: details }
      );
    }
  }

  validateEmail(field, object) {
    const email = object[field];
    if (email && !this.isValidEmail(email)) {
      throw new this.ValidationError(
        `Email inválido en campo: ${field}`,
        { [field]: 'Formato de email inválido' }
      );
    }
  }
validateLength(field, object, { min, max } = {}) {
    const value = object[field];
    if (!value) return; 
    
    const length = value.toString().length;
    
    if (min && length < min) {
        throw new this.ValidationError(
            `Campo ${field} debe tener al menos ${min} caracteres`,
            { [field]: `Mínimo ${min} caracteres` }
        );
    }
    
    if (max && length > max) {
        throw new this.ValidationError(
            `Campo ${field} no puede tener más de ${max} caracteres`,
            { [field]: `Máximo ${max} caracteres` }
        );
    }
}

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Validator;