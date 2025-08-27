const express = require('express');
module.exports = (authController) => {
  const router = express.Router();

  router.route('/')
    .post(authController.agregarUsuario.bind(authController));

  router.route('/login')
    .post(authController.loginUsuario.bind(authController));
  
  router.route('/renovar-token-acceso')
  .post(authController.renovarTokenAcceso.bind(authController));

    router.route('/renovar-refresh-token')
  .post(authController.renovarTokenAcceso.bind(authController));


  return router;
};