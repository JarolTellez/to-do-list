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
  .route('/gestionar')
  .post(tareaController.eliminarTarea)
  .patch(tareaController.actualizarTareaCompletada);

router
 .route('/actualizar')
 .patch(tareaController.actualizarTarea);

    

module.exports = router;
