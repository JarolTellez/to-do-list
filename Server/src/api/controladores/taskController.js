class TaskController {
  constructor({ taskService, taskMapper }) {
    this.taskService = taskService;
    this.taskMapper = taskMapper;
   
  }

  async createTask(req, res, next) {
    try {
      const task = this.taskMapper.requestToDomain(req.body);
      const updatedTask = await this.taskService.createTask(task);

      return res.status(201).json({
        status: 'success',
        message: `Tarea agregada: ${updatedTask}`,
        data: updatedTask,
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
      const { taskId, userId } = req.body;
      await this.taskService.deleteTask(taskId, userId);

      return res.status(200).json({
        status: 'success',
        message: `Tarea con ID ${taskId} eliminada correctamente.`,
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
     // const tarea = req.body;
        const mappedTask = this.taskMapper.requestToDomain(req.body);

      //const tarea = this.taskMapper.requestToDomain(req.body);
      const updatedTask = await this.taskService.updateTask(mappedTask);

      return res.status(200).json({
        status: 'success',
        message: `Tarea actualizada: ${updatedTask}`,
        data: updatedTask,
      });
    } catch (error) {
      // console.error('Error en actualizarTarea:', error);
      // return res.status(500).json({
      //   status: 'error',
      //   message: 'Ocurrió un error al intentar actualizar la tarea.',
      //   error: error.message,
      // });
      next(error);
    }
  }

  async completeTask(req, res, next) {
    try {
      
      const { taskId, isCompleted } = req.body;
      const updatedTask = await this.taskService.completeTask(taskId, isCompleted);

      return res.status(200).json({
        status: 'success',
        message: `Estado de tarea actualizado: ${updatedTask}`,
        data: updatedTask,
      });
    } catch (error) {
      // console.error('Error en actualizarTareaCompletada:', error);
      // return res.status(500).json({
      //   status: 'error',
      //   message: 'Ocurrió un error al intentar actualizar el estado de la tarea.',
      //   error: error.message,
      // });
      next(error);
    }
  }

  async findAllTasksByUserId(req, res, next) {
    try {
      const { userId } = req.body;
      const { pendingTasks, completedTasks } = await this.taskService.getAllTasksByUserId(userId);

      return res.status(200).json({
        status: 'success',
        message: 'Tareas consultadas exitosamente',
        data: { pendingTasks, completedTasks }
      });
    } catch (error) {
      // console.error('Error en consultarTareasPoruserId:', error);
      // return res.status(500).json({
      //   status: 'error',
      //   message: 'Ocurrió un error al intentar consultar las tareas.',
      //   error: error.message,
      // });
      next(error);
    }
  }
}

module.exports = TaskController;
