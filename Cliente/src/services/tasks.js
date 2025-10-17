import { api } from "./apiClient.js";
import { taskMappers } from '../mappers/taskMapper.js';

export async function createTask(newTask) {
  try {
    const taskDTO = taskMappers.taskToCreateDTO(newTask);
    const response = await api.post("/task/", taskDTO);
    
    return taskMappers.apiToTask(response.data);
  } catch (error) {
    throw error;
  }
}

export async function findAllTasksByUserId(userId, options = {}) {
  try {
    const response = await api.get("/task/", { 
      params: options
    });

    const allTasks = response.data.tasks?.map(taskMappers.apiToTask) || [];

    return allTasks;
  } catch (error) {
    throw error;
  }
}

export async function completeTask(taskId, isCompleted) {
  try {
    const response = await api.patch("/task/completion", {
      taskId: taskId, 
      isCompleted: isCompleted
    });
    return response.data;
  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }
}

export async function updateTask(updatedTask) {
  try {
    const updateDTO = taskMappers.taskToUpdateDTO(updatedTask);
    const response = await api.patch("/task/update", updateDTO);
    
    return taskMappers.apiToTask(response.data);
  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }
}

export async function deleteTask(taskId) {
  try {
    const userId = sessionStorage.getItem("userId");
    const response = await api.delete("/task/", {
      data: {
        taskId: taskId,
        userId: userId,
      }
    });
    return response.data;
  } catch (error) {
    throw new Error("Error al eliminar la tarea: " + error.message);
  }
}