/**
 * Task management controller for handling task-related API endpoints
 * @class TaskController
 * @description Handles task CRUD operations and management
 */
class TaskController {
  /**
   * Creates a new TaskController instance
   * @constructor
   * @param {Object} dependencies - Controller dependencies
   * @param {TaskService} dependencies.taskService - Task service instance
   * @param {Object} dependencies.taskMapper - Task mapper for data transformation
   */
  constructor({ taskService, taskMapper }) {
    this.taskService = taskService;
    this.taskMapper = taskMapper;
  }

  /**
   * Creates a new task for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with created task
   */
  async createTask(req, res, next) {
    try {
      const userId = req.user.userId;
      const taskData = {
        ...req.body,
        userId,
      };
      const task = this.taskMapper.requestDataToCreateDTO(taskData);
      const createdTask = await this.taskService.createTask(task);

      const responseTask = this.taskMapper.domainToResponseDTO(createdTask);

      return res.status(201).json({
        success: true,
        message: `Tarea agregada exitosamente`,
        data: responseTask,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a task for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with deletion result
   */
  async deleteTask(req, res, next) {
    try {
      const userId = req.user.userId;
      const { taskId } = req.body.data || req.body;
      await this.taskService.deleteTask(taskId, userId);

      return res.status(200).json({
        success: true,
        message: `Tarea con ID ${taskId} eliminada.`,
        data: {
          taskId: taskId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing task for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with updated task
   */
  async updateTask(req, res, next) {
    try {
      const userId = req.user.userId;
      const taskData = {
        ...req.body,
        userId,
      };

      const mappedTask = this.taskMapper.requestDataToUpdateDTO(taskData);
      const updatedTask = await this.taskService.updateTask(mappedTask);
      const responseTask = this.taskMapper.domainToResponseDTO(updatedTask);

      return res.status(200).json({
        success: true,
        message: `Tarea actualizada`,
        data: responseTask,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marks a task as completed or incomplete
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with completion status
   */
  async completeTask(req, res, next) {
    try {
      const userId = req.user.userId;
      const { taskId, isCompleted } = req.body;
      const updatedTask = await this.taskService.completeTask({
        taskId,
        isCompleted,
        userId,
      });

      return res.status(200).json({
        success: true,
        message: `Estado de tarea actualizado: ${updatedTask.isCompleted}`,
        data: {
          taskId: updatedTask.id,
          isCompleted: updatedTask.isCompleted,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all tasks for the current user with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with paginated task list
   */
  async getAllTasksByUserId(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        page,
        limit,
        isCompleted,
        scheduledDateBefore,
        scheduledDateAfter,
        sortBy,
        sortOrder,
      } = req.query;
      const result = await this.taskService.getAllTasksByUserId(userId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        isCompleted:
          isCompleted !== undefined ? isCompleted === "true" : undefined,
        scheduledDateBefore,
        scheduledDateAfter,
        sortBy,
        sortOrder,
      });
      const mappedResult = this._mapPaginationResponse(result);

      return res.status(200).json({
        success: true,
        message: "Tareas consultadas exitosamente",
        data: mappedResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Maps pagination response with domain to response transformation
   * @private
   * @param {Object} paginationResponse - Paginated response from service
   * @returns {Object} Mapped pagination response with transformed data
   */
  _mapPaginationResponse(paginationResponse) {
    if (!paginationResponse || !paginationResponse.tasks) {
      return paginationResponse;
    }

    return {
      ...paginationResponse,
      tasks: paginationResponse.tasks.map((task) =>
        this.taskMapper.domainToResponseDTO(task)
      ),
    };
  }
}

module.exports = TaskController;
