const express = require('express');
const UsuarioController = require('../logica/UsuarioController');
//const { handleErrors } = require('../utils/appError');
const router = express.Router();


// Definir las rutas
router
  .route('/')
    .post(UsuarioController.agregarUsuario)
    //.get(UsuarioController.); para obtener los usuarios pero aun no tengo el metodo

    router
  .route('/login')
    .post(UsuarioController.loginUsuario);
    
// router.use(handleErrors);

module.exports = router;
