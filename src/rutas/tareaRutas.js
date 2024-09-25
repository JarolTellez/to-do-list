const express = require('express');
const tareaController = require('../logica/TareaController');
const etiquetaController=require('../logica/EtiquetaController')
//const { handleErrors } = require('../utils/appError');
const router = express.Router();


// Definir las rutas
router
  .route('/')
    .post(tareaController.agregarTarea)

router
.route('/etiquetas')
.post(etiquetaController.consultarEtiquetasPorIdUsuario);
   

    

module.exports = router;
