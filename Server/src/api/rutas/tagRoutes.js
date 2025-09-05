const express = require('express');
const {validateAccessToken} = require('../middlewares/validateAccessToken');
module.exports = (etiquetaController) => {
  const router = express.Router();

  router.route('/')
    .post(validateAccessToken,etiquetaController.consultarEtiquetasPorIdUsuario.bind(etiquetaController));

  return router;
};