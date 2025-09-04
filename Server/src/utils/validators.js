const validateRequired =(ValidationError)=>{
  return (fields, object) => {
  const missing = [];
  const details = {};
  
  fields.forEach(field => {
    if (!object[field] || object[field].toString().trim() === '') {
      missing.push(field);
      details[field] = 'Campo requerido';
    }
  });
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Campos requeridos faltantes: ${missing.join(', ')}`,
      { camposFaltantes: details }
    );
  }
};

}

module.exports = validateRequired;
