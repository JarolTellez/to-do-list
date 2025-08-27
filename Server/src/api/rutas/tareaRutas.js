const express = require('express');
const {validarTokenAcceso} = require("../middlewares/validarTokenAcceso");


module.exports = (tareaController) => {
  const router = express.Router();

  router.route('/')
    .post(tareaController.agregarTarea.bind(tareaController));

  router.route('/consultar')
    .post(validarTokenAcceso,tareaController.consultarTareasPorIdUsuario.bind(tareaController));
   
  router.route('/gestionar')
    .post(tareaController.eliminarTarea.bind(tareaController))
    .patch(tareaController.actualizarTareaCompletada.bind(tareaController));

  router.route('/actualizar')
    .patch(tareaController.actualizarTarea.bind(tareaController));

  return router;
};

