import { apiClient } from "./api/clients/apiClient.js";
import { tagMappers } from "../mappers/tagMapper.js";
import { PaginationValidator } from "../utils/validators/paginationValidator.js";

export async function loadTags(page, limit) {
   const validated = PaginationValidator.validateParams("TAGS", page, limit);
  const response = await apiClient.api.get("/tag/", {
    params: {
      page: validated.page,
      limit: validated.limit,
    },
  });
  const mappedTags = response.data.tags?.map(tagMappers.apiToTag) || [];
  return { data: mappedTags, message: response.message };
}

export async function createTag(tagData) {
  const tagDTO = tagMappers.tagToCreateDTO(tagData);
  const response = await apiClient.api.post("/tag/", tagDTO);

  const mappedTag = tagMappers.apiToTag(response.data);
  return { data: mappedTag, message: response.message };
}

export async function updateTag(tagId, tagData) {
  const tagDTO = tagMappers.tagToCreateDTO(tagData);
  const response = await apiClient.api.put(`/tag/${tagId}`, tagDTO);

  const mappedTag = tagMappers.apiToTag(response.data);
  return { data: mappedTag, message: response.message };
}

export async function deleteTag(tagId) {
  const response = await apiClient.api.delete(`/tag/${tagId}`);
  return { data: response.data, message: response.message };
}
