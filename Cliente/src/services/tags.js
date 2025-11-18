import { apiClient } from "./api/clients/apiClient.js";
import { tagMappers } from "../mappers/tagMapper.js";
import { PaginationValidator } from "../utils/validators/paginationValidator.js";

/**
 * Loads available tags with pagination
 * @async
 * @function loadTags
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @returns {Promise<Object>} Paginated tags data
 */
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

/**
 * Creates new tag
 * @async
 * @function createTag
 * @param {Object} tagData - Tag creation data
 * @returns {Promise<Object>} Created tag data
 */
export async function createTag(tagData) {
  const tagDTO = tagMappers.tagToCreateDTO(tagData);
  const response = await apiClient.api.post("/tag/", tagDTO);

  const mappedTag = tagMappers.apiToTag(response.data);
  return { data: mappedTag, message: response.message };
}

/**
 * Updates existing tag
 * @async
 * @function updateTag
 * @param {string} tagId - Tag identifier to update
 * @param {Object} tagData - Updated tag data
 * @returns {Promise<Object>} Updated tag data
 */
export async function updateTag(tagId, tagData) {
  const tagDTO = tagMappers.tagToCreateDTO(tagData);
  const response = await apiClient.api.put(`/tag/${tagId}`, tagDTO);

  const mappedTag = tagMappers.apiToTag(response.data);
  return { data: mappedTag, message: response.message };
}

/**
 * Deletes tag by ID
 * @async
 * @function deleteTag
 * @param {string} tagId - Tag identifier to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteTag(tagId) {
  const response = await apiClient.api.delete(`/tag/${tagId}`);
  return { data: response.data, message: response.message };
}
