const {SORT_FIELD_MAPPINGS} = require('../../constants/sortConstants');

export const validateSortField = (value, validFields, entityType, fieldName = 'sort field') => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const normalizedValue = value.toLowerCase();
  
  const validField = Object.values(validFields).find(
    field => field.toLowerCase() === normalizedValue
  );
  
  if (!validField) {
    throw new ValidationError(
      `Invalid ${fieldName}. Valid values: ${Object.values(validFields).join(", ")}`
    );
  }
  
  // se obtiene el campo seguro del mapping
  const entityMapping = SORT_FIELD_MAPPINGS[entityType];
  if (!entityMapping) {
    throw new ValidationError(`Invalid entity type: ${entityType}`);
  }
  
  const safeField = entityMapping[validField];
  if (!safeField) {
    throw new ValidationError(
      `No safe mapping found for field '${validField}' in entity '${entityType}'`
    );
  }
  
  return {
    originalField: validField,
    safeField: safeField
  };
};

export const validateSortOrder = (value, validOrders) => {
  if (typeof value !== 'string') {
    throw new ValidationError('Sort order must be a string');
  }
  
  const normalizedValue = value.toLowerCase();
  const validOrder = Object.values(validOrders).find(
    order => order.toLowerCase() === normalizedValue
  );
  
  if (!validOrder) {
    throw new ValidationError(
      `Invalid sort order. Valid values: ${Object.values(validOrders).join(", ")}`
    );
  }
  
  // Convertir a uppercase para SQL
  const safeOrder = validOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  return {
    originalOrder: validOrder,
    safeOrder: safeOrder
  };
};