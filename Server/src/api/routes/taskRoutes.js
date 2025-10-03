const express = require('express');
const {validateAccessToken} = require('../middlewares/validateAccessToken');


module.exports = (taskController) => {
  const router = express.Router();

  router.route('/')
    .post(validateAccessToken,taskController.createTask.bind(taskController));

  router.route('/consultar')
    .post(validateAccessToken,taskController.findAllTasksByUserId.bind(taskController));
   
  router.route('/gestionar')
    .post(validateAccessToken,taskController.deleteTask.bind(taskController))
    .patch(validateAccessToken,taskController.completeTask.bind(taskController));

  router.route('/update')
    .patch(validateAccessToken,taskController.updateTask.bind(taskController));

  return router;
};

