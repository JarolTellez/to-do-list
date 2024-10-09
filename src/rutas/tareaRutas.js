const express = require('express');
const tareaController = require('../logica/tareaController');
//const { handleErrors } = require('../utils/appError');
const router = express.Router();



router
  .route('/')
    .post(tareaController.agregarTarea);

router
.route('/consultar')
.post(tareaController.consultarTareasPorIdUsuario);
   
router
  .route('/:id/completar')
  .patch(tareaController.actualizarTareaCompletada);

    

module.exports = router;
