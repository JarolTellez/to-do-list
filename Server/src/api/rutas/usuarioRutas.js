const express = require('express');
module.exports = (usuarioController) => {
  const router = express.Router();

  router.route('/')
    .post(usuarioController.agregarUsuario.bind(usuarioController));

  router.route('/login')
    .post(usuarioController.loginUsuario.bind(usuarioController));

  return router;
};