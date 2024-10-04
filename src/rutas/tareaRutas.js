const express = require('express');
const tareaController = require('../logica/TareaController');
//const { handleErrors } = require('../utils/appError');
const router = express.Router();



router
  .route('/')
    .post(tareaController.agregarTarea);

router
.route('/consultar')
.post(tareaController.consultarTareasPorIdUsuario);
   


    

module.exports = router;
