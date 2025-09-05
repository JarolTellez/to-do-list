const express = require('express');
const {validateAccessToken} = require('../middlewares/validateAccessToken');


module.exports = (tareaController) => {
  const router = express.Router();

  router.route('/')
    .post(validateAccessToken,tareaController.agregarTarea.bind(tareaController));

  router.route('/consultar')
    .post(validateAccessToken,tareaController.consultarTareasPorIdUsuario.bind(tareaController));
   
  router.route('/gestionar')
    .post(validateAccessToken,tareaController.eliminarTarea.bind(tareaController))
    .patch(validateAccessToken,tareaController.actualizarTareaCompletada.bind(tareaController));

  router.route('/actualizar')
    .patch(validateAccessToken,tareaController.actualizarTarea.bind(tareaController));

  return router;
};

