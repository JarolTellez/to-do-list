import { apiClient } from "./api/clients/apiClient.js";
import { userMappers } from "../mappers/userMapper.js";

export async function getUserProfile() {
  try {
    const response = await apiClient.api.get("/user/profile");
    const mappedUser = userMappers.apiToUser(response.data);
    return { data: mappedUser, message: response.message };
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function updateUserProfile(profileData) {
  try {
    const updateDTO = userMappers.userToUpdateDTO(profileData);

    const response = await apiClient.api.put("/user/", updateDTO);
    const mappedUser = userMappers.apiToUser(response.data);

    return { data: mappedUser, message: response.message };
  } catch (error) {
    console.error("Error updatin user profile:", error);
    throw error;
  }
}

export async function changePassword(passwordData) {
  try {
    const response = await apiClient.api.patch("/user/change-password", passwordData);

    return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
}

export async function deleteUserAccount() {
  try {
    const response = await apiClient.api.delete("/user/");
    if (response.success === true) {
      clearLocalState();
    }
    return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
}

function clearLocalState() {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
}
