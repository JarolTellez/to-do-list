const express = require("express");
const { validateAccessToken } = require("../middlewares/validateAccessToken");

module.exports = (taskController) => {
  const router = express.Router();

  router
    .route("/")
    .get(validateAccessToken, taskController.getAllTasksByUserId.bind(taskController))
    .post(validateAccessToken, taskController.createTask.bind(taskController));
  
  //   router.get(
  //   "/completed",
  //   validateAccessToken,
  //   taskController.getCompletedTasks.bind(taskController)
  // );

  //  router.get('/pending', 
  //   validateAccessToken, 
  //   taskController.getPendingTasks.bind(taskController)
  // );

  // router.get('/overdue', 
  //   validateAccessToken, 
  //   taskController.getOverdueTasks.bind(taskController)
  // );
  
  // router.get('/:taskId', 
  //   validateAccessToken, 
  //   taskController.getTaskById.bind(taskController)
  // );

    router.delete('/', 
    validateAccessToken, 
    taskController.deleteTask.bind(taskController)
  );

   router.patch('/completion', 
    validateAccessToken, 
    taskController.completeTask.bind(taskController)
  );

  router
    .route("/update")
    .patch(validateAccessToken, taskController.updateTask.bind(taskController));

  return router;
};
