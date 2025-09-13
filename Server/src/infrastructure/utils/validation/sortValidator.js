export const validateSortField = (value, validFields, fieldName = 'sort field') => {
  if (!Object.values(validFields).includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Valid values: ${Object.values(validFields).join(", ")}`
    );
  }
  return value;
};

export const validateSortOrder = (value, validOrders) => {
  if (!Object.values(validOrders).includes(value)) {
    throw new ValidationError(
      `Invalid sort order. Valid values: ${Object.values(validOrders).join(", ")}`
    );
  }
  return value;
};