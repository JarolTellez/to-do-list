const express = require('express');
const { pruebas } = require('./pruebas');
module.exports = (authController) => {
  const router = express.Router();

  router.route('/').post(authController.registerUser.bind(authController));

  router
    .route('/login')
    .post(pruebas, authController.login.bind(authController));

  router
    .route('/logout')
    .post(pruebas, authController.logOut.bind(authController));

  router
    .route('/renovar-access-token')
    .post(authController.refreshAccessToken.bind(authController));

  router
    .route('/renovar-refresh-token')
    .post(authController.refreshRefreshToken.bind(authController));

  return router;
};
