const express = require('express');
module.exports = (etiquetaController) => {
  const router = express.Router();

  router.route('/')
    .post(etiquetaController.consultarEtiquetasPorIdUsuario.bind(etiquetaController));

  return router;
};