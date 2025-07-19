// const express= require("express");
// const etiquetaController=require('../logica/EtiquetaController');
// const router=express.Router();

// router
//  .route('/')
//     .post(etiquetaController.consultarEtiquetasPorIdUsuario)

 

// module.exports= router;
const express = require('express');
module.exports = (etiquetaController) => {
  const router = express.Router();

  router.route('/')
    .post(etiquetaController.consultarEtiquetasPorIdUsuario.bind(etiquetaController));

  return router;
};