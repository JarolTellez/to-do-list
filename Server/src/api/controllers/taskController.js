class TaskController {
  constructor({ taskService, taskMapper }) {
    this.taskService = taskService;
    this.taskMapper = taskMapper;
  }

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

  async deleteTask(req, res, next) {
    try {
      const userId = req.user.userId;
      const { taskId } = req.body;
      await this.taskService.deleteTask(taskId, userId);

      return res.status(200).json({
        success: true,
        message: `Tarea con ID ${taskId} eliminada correctamente.`,
        data: {
          taskId: taskId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

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

  async getAllTasksByUserId(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        pendingPage,
        pendingLimit,
        completedPage,
        completedLimit,
        overduePage,
        overdueLimit,
      } = req.query;
      const result = await this.taskService.getAllTasksByUserId(userId, {
        pendingPage: parseInt(pendingPage),
        pendingLimit: parseInt(pendingLimit),
        completedPage: parseInt(completedPage),
        completedLimit: parseInt(completedLimit),
        overduePage: parseInt(overduePage),
        overdueLimit: parseInt(overdueLimit),
      });

      const mappedResult = {
        pendingTasks: this._mapPaginationResponse(result.pendingTasks),
        completedTasks: this._mapPaginationResponse(result.completedTasks),
        overdueTasks: this._mapPaginationResponse(result.overdueTasks),
      };

      return res.status(200).json({
        success: true,
        message: "Tareas consultadas exitosamente",
        data: mappedResult,
      });
    } catch (error) {
      next(error);
    }
  }

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
