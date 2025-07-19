// const express = require('express');
// const tareaController = require('../controladores/tareaController');
// //const { handleErrors } = require('../utils/appError');
// const router = express.Router();



// router
//   .route('/')
//     .post(tareaController.agregarTarea);

// router
// .route('/consultar')
// .post(tareaController.consultarTareasPorIdUsuario);
   
// router
//   .route('/gestionar')
//   .post(tareaController.eliminarTarea)
//   .patch(tareaController.actualizarTareaCompletada);

// router
//  .route('/actualizar')
//  .patch(tareaController.actualizarTarea);

    

// module.exports = router;
// src/rutas/tareaRutas.js
const express = require('express');

// Exporta una función que recibe el controlador
module.exports = (tareaController) => {
  const router = express.Router();

  router.route('/')
    .post(tareaController.agregarTarea.bind(tareaController));

  router.route('/consultar')
    .post(tareaController.consultarTareasPorIdUsuario.bind(tareaController));
   
  router.route('/gestionar')
    .post(tareaController.eliminarTarea.bind(tareaController))
    .patch(tareaController.actualizarTareaCompletada.bind(tareaController));

  router.route('/actualizar')
    .patch(tareaController.actualizarTarea.bind(tareaController));

  return router;
};