const express = require('express');
const {validarTokenAcceso} = require("../middlewares/validarTokenAcceso");


module.exports = (tareaController) => {
  const router = express.Router();

  router.route('/')
    .post(validarTokenAcceso,tareaController.agregarTarea.bind(tareaController));

  router.route('/consultar')
    .post(validarTokenAcceso,tareaController.consultarTareasPorIdUsuario.bind(tareaController));
   
  router.route('/gestionar')
    .post(validarTokenAcceso,tareaController.eliminarTarea.bind(tareaController))
    .patch(validarTokenAcceso,tareaController.actualizarTareaCompletada.bind(tareaController));

  router.route('/actualizar')
    .patch(validarTokenAcceso,tareaController.actualizarTarea.bind(tareaController));

  return router;
};

