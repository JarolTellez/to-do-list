const express = require("express");
const {validateAccessToken} = require('../middlewares/validateAccessToken');
module.exports = (authController) => {
  const router = express.Router();

  router
    .route("/login")
    .post(authController.login.bind(authController));

  router
    .route("/logout")
    .post(validateAccessToken, authController.logOut.bind(authController));

  router
    .route("/refresh-access-token")
    .post(authController.refreshAccessToken.bind(authController));

  router
    .route("/active-sessions")
    .get(validateAccessToken, authController.getUserActiveSessions.bind(authController));

  router
    .route("/close-all-sessions")
    .patch(validateAccessToken, authController.closeAllUserSessions.bind(authController));

  // router
  //   .route("/sessions/:sessionId/close")
  //   .patch(pruebas, authController.closeSpecificSession.bind(authController));

  return router;
};
