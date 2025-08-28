const express = require('express');
const {validarTokenAcceso} = require("../middlewares/validarTokenAcceso");
module.exports = (etiquetaController) => {
  const router = express.Router();

  router.route('/')
    .post(validarTokenAcceso,etiquetaController.consultarEtiquetasPorIdUsuario.bind(etiquetaController));

  return router;
};