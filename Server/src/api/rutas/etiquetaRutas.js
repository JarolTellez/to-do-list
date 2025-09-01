const express = require('express');
const {validarAccessToken} = require("../middlewares/validarAccessToken");
module.exports = (etiquetaController) => {
  const router = express.Router();

  router.route('/')
    .post(validarAccessToken,etiquetaController.consultarEtiquetasPorIdUsuario.bind(etiquetaController));

  return router;
};