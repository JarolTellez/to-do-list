import { apiClient } from "./api/clients/apiClient.js";
import { taskMappers } from "../mappers/taskMapper.js";

export async function createTask(newTask) {
    const taskDTO = taskMappers.taskToCreateDTO(newTask);
    const response = await apiClient.api.post("/task/", taskDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
}

export async function findAllTasksByUserId() {
    const response = await apiClient.api.get("/task/");

    const mappedTasks = response.data.tasks?.map(taskMappers.apiToTask) || [];
    return { data: mappedTasks, message: response.message };

}

export async function completeTask(taskId, isCompleted) {
    const response = await apiClient.api.patch("/task/completion", {
      taskId: taskId,
      isCompleted: isCompleted,
    });
    return { data: response.data, message: response.message };
  } 


export async function updateTask(updatedTask) {
    const updateDTO = taskMappers.taskToUpdateDTO(updatedTask);
    const response = await apiClient.api.patch("/task/update", updateDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
}

export async function deleteTask(taskId) {
    const userId = sessionStorage.getItem("userId");
    const response = await apiClient.api.delete("/task/", {
      data: {
        taskId: taskId,
        userId: userId,
      },
    });
   return { data: response.data, message: response.message };
}
