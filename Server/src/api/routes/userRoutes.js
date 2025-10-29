const express = require("express");
const { validateAccessToken } = require("../middlewares/validateAccessToken");
module.exports = (userController) => {
  const router = express.Router();

  router
    .route("/")
    .post(userController.registerUser.bind(userController))
    .put(validateAccessToken,userController.updateUser.bind(userController))
    .delete(validateAccessToken,userController.deleteUser.bind(userController));

  router
    .route("/change-password")
    .patch(validateAccessToken,userController.updateUserPassword.bind(userController));


  return router;
};
