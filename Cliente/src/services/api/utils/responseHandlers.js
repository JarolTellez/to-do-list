export function handleServiceResponse(data, mapper = null) {
  if (data.success === false) {
    return { success: false, error: data.message };
  }

  if (mapper) {
    const sourceData = data.data;
    const mappedData = mapper(sourceData);
    return { success: true, ...mappedData };
  }

  return { success: true, data: data.data || data };
}

export function handleServiceError(error) {
  return {
    success: false,
    error: error.message || "Error de conexión",
  };
}