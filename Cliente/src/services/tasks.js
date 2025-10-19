import { api } from "./api/clients/apiClient.js";
import { taskMappers } from "../mappers/taskMapper.js";

export async function createTask(newTask) {
  try {
    const taskDTO = taskMappers.taskToCreateDTO(newTask);
    const response = await api.post("/task/", taskDTO);

    const mappedTaks = taskMappers.apiToTask(response.data);
    return { data: mappedTaks, message: response.message };
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function findAllTasksByUserId(userId, options = {}) {
  try {
    const response = await api.get("/task/", {
      params: options,
    });

    const mappedTasks = response.data.tasks?.map(taskMappers.apiToTask) || [];
    return { data: mappedTasks, message: response.message };
  } catch (error) {
    console.error("Error finding tasks:", error);
    throw error;
  }
}

export async function completeTask(taskId, isCompleted) {
  try {
    const response = await api.patch("/task/completion", {
      taskId: taskId,
      isCompleted: isCompleted,
    });
    return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error completing task:", error);
    throw error;
  }
}

export async function updateTask(updatedTask) {
  try {
    const updateDTO = taskMappers.taskToUpdateDTO(updatedTask);
    const response = await api.patch("/task/update", updateDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
  } catch (error) {
    console.error("Error updatig task:", error);
    throw error;
  }
}

export async function deleteTask(taskId) {
  try {
    const userId = sessionStorage.getItem("userId");
    const response = await api.delete("/task/", {
      data: {
        taskId: taskId,
        userId: userId,
      },
    });
   return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error deleting tasks:", error);
    throw error;
  }
}
