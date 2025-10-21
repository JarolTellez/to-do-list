import {apiClient } from "./api/clients/apiClient.js";
import { tagMappers } from "../mappers/tagMapper.js";

export async function loadTags() {
  try {
    const response = await apiClient.api.get("/tag/");
    const mappedTags = response.data.tags?.map(tagMappers.apiToTag) || [];
    return { data: mappedTags, message: response.message };
  } catch (error) {
    console.error("Error loading tags:", error);
    throw error;
  }
}

export async function createTag(tagData) {
  try {
    const tagDTO = tagMappers.tagToCreateDTO(tagData);
    const response = await apiClient.api.post("/tag/", tagDTO);

    const mappedTag = tagMappers.apiToTag(response.data);
    return { data: mappedTag, message: response.message };
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
}

export async function updateTag(tagId, tagData) {
  try {
    const tagDTO = tagMappers.tagToCreateDTO(tagData);
    const response = await apiClient.api.put(`/tag/${tagId}`, tagDTO);

    const mappedTag = tagMappers.apiToTag(response.data);
    return { data: mappedTag, message: response.message };
  } catch (error) {
    console.error("Error updating tag:", error);
    throw error;
  }
}

export async function deleteTag(tagId) {
  try {
    const response = await apiClient.api.delete(`/tag/${tagId}`);
    return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
}
