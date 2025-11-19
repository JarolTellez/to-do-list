import { apiClient } from "./api/clients/apiClient.js";
import { userMappers } from "../mappers/userMapper.js";

/**
 * Retrieves current user profile data
 * @async
 * @function getUserProfile
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile() {
  const response = await apiClient.api.get("/user/profile");
  const mappedUser = userMappers.apiToUser(response.data);
  return { data: mappedUser, message: response.message };
}

/**
 * Updates user profile information
 * @async
 * @function updateUserProfile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUserProfile(profileData) {
  const updateDTO = userMappers.userToUpdateDTO(profileData);

  const response = await apiClient.api.put("/user/", updateDTO);
  const mappedUser = userMappers.apiToUser(response.data);

  return { data: mappedUser, message: response.message };
}

/**
 * Changes user password
 * @async
 * @function changePassword
 * @param {Object} passwordData - Password change data
 * @returns {Promise<Object>} Password change result
 */
export async function changePassword(passwordData) {
  const response = await apiClient.api.patch(
    "/user/change-password",
    passwordData
  );

  return { data: response.data, message: response.message };
}

/**
 * Permanently deletes user account
 * @async
 * @function deleteUserAccount
 * @returns {Promise<Object>} Account deletion result
 */
export async function deleteUserAccount() {
  const response = await apiClient.api.delete("/user/");
  return { data: response.data, message: response.message };
}
