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
      // if (error.message.startsWith('[')) {
      //   const errors = JSON.parse(error.message);
      //   return res.status(400).json({
      //     status: 'error',
      //     message: 'Errores de validación',
      //     error: errores,
      //   });
      // }

      // console.error('Error en agregarTarea:', error);
      // return res.status(500).json({
      //   status: 'error',
      //   message: 'Ocurrió un error al intentar guardar la tarea.',
      //   error: error.message,
      // });
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
      // console.error('Error en eliminarTarea:', error);
      // return res.status(500).json({
      //   status: 'error',
      //   message: 'Ocurrió un error al intentar eliminar la tarea.',
      //   error: error.message,
      // });
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
        pendingPage = 1,
        pendingLimit = 10,
        completedPage = 1,
        completedLimit = 10,
        overduePage = 1,
        overdueLimit = 10,
      } = req.query;
      const result=
        await this.taskService.getAllTasksByUserId(userId, {
          pendingPage: parseInt(pendingPage),
          pendingLimit: parseInt(pendingLimit),
          completedPage: parseInt(completedPage),
          completedLimit: parseInt(completedLimit),
          overduePage: parseInt(overduePage),
          overdueLimit: parseInt(overdueLimit),
        });

      return res.status(200).json({
        success: true,
        message: "Tareas consultadas exitosamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;
