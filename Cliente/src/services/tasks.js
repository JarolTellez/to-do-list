import { apiClient } from "./api/clients/apiClient.js";
import { taskMappers } from "../mappers/taskMapper.js";
import { PaginationValidator } from "../utils/validators/paginationValidator.js";

/**
 * Task management service for CRUD operations
 * @class TaskService
 * @description Handles all task-related API operations
 */
class TaskService {
  /**
   * Creates new task
   * @async
   * @function create
   * @param {Object} newTask - Task creation data
   * @returns {Promise<Object>} Created task data
   */
  async create(newTask) {
    const taskDTO = taskMappers.taskToCreateDTO(newTask);
    const response = await apiClient.api.post("/task/", taskDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
  }

  /**
   * Retrieves paginated tasks for current user
   * @async
   * @function findAllByUserId
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} Paginated tasks data
   */
  async findAllByUserId(page, limit) {
    const validated = PaginationValidator.validateParams("TASKS", page, limit);
    const response = await apiClient.api.get("/task/", {
      params: {
        page: validated.page,
        limit: validated.limit,
      },
    });
    const mappedTasks = response.data.tasks?.map(taskMappers.apiToTask) || [];
    return {
      data: { tasks: mappedTasks, pagination: response.data.pagination },
      message: response.message,
    };
  }

  /**
   * Updates task completion status
   * @async
   * @function complete
   * @param {string} taskId - Task identifier
   * @param {boolean} isCompleted - New completion status
   * @returns {Promise<Object>} Updated task data
   */
  async complete(taskId, isCompleted) {
    const response = await apiClient.api.patch("/task/completion", {
      taskId: taskId,
      isCompleted: isCompleted,
    });
    return { data: response.data, message: response.message };
  }

  /**
   * Updates existing task
   * @async
   * @function update
   * @param {Object} updatedTask - Updated task data
   * @returns {Promise<Object>} Updated task data
   */
  async update(updatedTask) {
    const updateDTO = taskMappers.taskToUpdateDTO(updatedTask);
    const response = await apiClient.api.patch("/task/update", updateDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
  }

  /**
   * Deletes task by ID
   * @async
   * @function delete
   * @param {string} taskId - Task identifier to delete
   * @returns {Promise<Object>} Deletion result
   */
  async delete(taskId) {
    const response = await apiClient.api.delete("/task/", {
      data: {
        taskId: taskId,
      },
    });
    return { data: response.data, message: response.message };
  }
}

export const taskService = new TaskService();
