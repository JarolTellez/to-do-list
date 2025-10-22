import { apiClient } from "./api/clients/apiClient.js";
import { userMappers } from "../mappers/userMapper.js";

export async function getUserProfile() {
    const response = await apiClient.api.get("/user/profile");
    const mappedUser = userMappers.apiToUser(response.data);
    return { data: mappedUser, message: response.message };
}

export async function updateUserProfile(profileData) {
    const updateDTO = userMappers.userToUpdateDTO(profileData);

    const response = await apiClient.api.put("/user/", updateDTO);
    const mappedUser = userMappers.apiToUser(response.data);

    return { data: mappedUser, message: response.message };
}

export async function changePassword(passwordData) {
    const response = await apiClient.api.patch("/user/change-password", passwordData);

    return { data: response.data, message: response.message };
}

export async function deleteUserAccount() {
    const response = await apiClient.api.delete("/user/");
    if (response.success === true) {
      clearLocalState();
    }
    return { data: response.data, message: response.message };
}

function clearLocalState() {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
}
