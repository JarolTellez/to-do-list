import { Tag } from "../models/tag";

/**
 * Tag data transformation utilities
 * @namespace tagMappers
 * @description Provides mapping functions for tag data between different representations
 */
export const tagMappers = {
  /**
   * Transforms API tag data to domain model
   * @function apiToTag
   * @param {Object} apiData - Raw API tag data
   * @returns {Tag} Domain tag object
   */
  apiToTag: (apiData) => {
    if (!apiData) return null;

    if (apiData.tag) {
      return new Tag({
        id: apiData.tag.id,
        name: apiData.tag.name,
        description: apiData.tag.description,
        createdAt: apiData.tag.createdAt,
      });
    }

    return new Tag({
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      createdAt: apiData.createdAt,
    });
  },

  /**
   * Transforms input data to tag domain model
   * @function inputToTag
   * @param {Object} tagInput - Tag input data
   * @returns {Tag} Domain tag object
   */
  inputToTag: (tagInput) => {
    return new Tag({
      id: tagInput.id || null,
      name: tagInput.name,
      description: tagInput.description,
      createdAt: tagInput.createdAt ? new Date(tagInput.createdAt) : new Date(),
    });
  },

  /**
   * Transforms tag domain model to create DTO
   * @function tagToCreateDTO
   * @param {Tag} tag - Domain tag object
   * @returns {Object} Create tag DTO
   */
  tagToCreateDTO: (tag) => {
    return {
      name: tag.name,
      description: tag.description,
    };
  },

  /**
   * Transforms tag domain model to update DTO
   * @function tagToUpdateDTO
   * @param {Tag} tag - Domain tag object
   * @returns {Object} Update tag DTO
   */
  tagToUpdateDTO: (tag) => {
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description,
    };
  },
};
