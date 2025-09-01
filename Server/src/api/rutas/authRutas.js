const express = require('express');
const {pruebas} = require("./pruebas");
module.exports = (authController) => {
  const router = express.Router();

  router.route('/')
    .post(authController.agregarUsuario.bind(authController));

  router.route('/login')
    .post(pruebas,authController.loginUsuario.bind(authController));
  
  router.route('/renovar-access-token')
  .post(authController.renovarAccessToken.bind(authController));

    router.route('/renovar-refresh-token')
  .post(authController.renovarRefreshToken.bind(authController));


  return router;
};