const express= require("express");
const etiquetaController=require('../logica/EtiquetaController');
const router=express.Router();

router
 .route('/')
    .post(etiquetaController.consultarEtiquetasPorIdUsuario)

 

module.exports= router;