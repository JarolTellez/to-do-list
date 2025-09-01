const express = require('express');
const {validarAccessToken} = require("../middlewares/validarAccessToken");


module.exports = (tareaController) => {
  const router = express.Router();

  router.route('/')
    .post(validarAccessToken,tareaController.agregarTarea.bind(tareaController));

  router.route('/consultar')
    .post(validarAccessToken,tareaController.consultarTareasPorIdUsuario.bind(tareaController));
   
  router.route('/gestionar')
    .post(validarAccessToken,tareaController.eliminarTarea.bind(tareaController))
    .patch(validarAccessToken,tareaController.actualizarTareaCompletada.bind(tareaController));

  router.route('/actualizar')
    .patch(validarAccessToken,tareaController.actualizarTarea.bind(tareaController));

  return router;
};

