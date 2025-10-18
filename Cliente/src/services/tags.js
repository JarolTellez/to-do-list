import { api } from "./api/clients/apiClient.js";
import { tagMappers } from '../mappers/tagMapper.js';
import { handleServiceResponse, handleServiceError } from "./api/utils/responseHandlers.js";

export async function loadTags() {
  try {
    const data = await api.get("/tag/");
    const response = handleServiceResponse(data, (sourceData) => ({
      tags: sourceData.tags?.map(tagMappers.apiToTag) || []
    }));
    return response.tags;    
  } catch (error) {
    throw new Error("Error al consultar las etiquetas: " + error.message);
  }
}

export async function createTag(tagData) {
  try {
    const tagDTO = tagMappers.tagToCreateDTO(tagData);
    const response = await api.post("/tag/", tagDTO);
    
    return tagMappers.apiToTag(response.data);
  } catch (error) {
    throw error;
  }
}

export async function updateTag(tagId, tagData) {
  try {
    const tagDTO = tagMappers.tagToCreateDTO(tagData);
    const response = await api.put(`/tag/${tagId}`, tagDTO);
    
    return tagMappers.apiToTag(response.data);
  } catch (error) {
    throw error;
  }
}

export async function deleteTag(tagId) {
  try {
    const response = await api.delete(`/tag/${tagId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}