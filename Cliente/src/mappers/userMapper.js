import { User } from "../models/user";

/**
 * User data transformation utilities
 * @namespace userMappers
 * @description Provides mapping functions for user data between different representations
 */
export const userMappers = {
  /**
   * Transforms API user data to domain model
   * @function apiToUser
   * @param {Object} apiData - Raw API user data
   * @returns {User} Domain user object
   */
  apiToUser: (apiData) => {
    return new User(
      apiData.id,
      apiData.username,
      apiData.email,
      apiData.rol || "user",
      apiData.createdAt,
      apiData.updatedAt,
      apiData.userTagsCount || 0,
      apiData.tasksCount || 0,
      apiData.userTags || [],
      apiData.tasks || []
    );
  },

  /**
   * Transforms user domain model to update DTO
   * @function userToUpdateDTO
   * @param {User} user - Domain user object
   * @returns {Object} Update user DTO
   */
  userToUpdateDTO: (user) => {
    return {
      username: user.username,
      email: user.email,
    };
  },

  /**
   * Transforms input data to registration DTO
   * @function inputToRegisterDTO
   * @param {Object} userInput - User input data
   * @returns {Object} Registration DTO
   */
  inputToRegisterDTO: (userInput) => {
    return {
      username: userInput.username,
      email: userInput.email,
      password: userInput.password,
    };
  },

  /**
   * Transforms input data to login DTO
   * @function inputToLoginDTO
   * @param {Object} userInput - User input data
   * @returns {Object} Login DTO
   */
  inputToLoginDTO: (userInput) => {
    return {
      identifier: userInput.identifier,
      password: userInput.password,
    };
  },
};
