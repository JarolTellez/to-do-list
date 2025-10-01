const express = require("express");
const { pruebas } = require("./pruebas");
const {validateAccessToken} = require('../middlewares/validateAccessToken');
module.exports = (authController) => {
  const router = express.Router();

  router
    .route("/login")
    .post(pruebas, authController.login.bind(authController));

  router
    .route("/logout")
    .post(validateAccessToken, authController.logOut.bind(authController));

  router
    .route("/renovar-access-token")
    .post(validateAccessToken,authController.refreshAccessToken.bind(authController));

  router
    .route("/renovar-refresh-token")
    .post(validateAccessToken,authController.refreshRefreshToken.bind(authController));

  router
    .route("/active-sessions")
    .get(validateAccessToken, authController.findUserActiveSessions.bind(authController));

  router
    .route("/close-all-sessions")
    .patch(validateAccessToken, authController.closeAllUserSessions.bind(authController));

  // router
  //   .route("/sessions/:sessionId/close")
  //   .patch(pruebas, authController.closeSpecificSession.bind(authController));

  return router;
};
