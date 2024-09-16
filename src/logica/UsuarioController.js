const UsuarioDAO = require('../datos/UsuarioDAO');
const Usuario=require('../dominio/Usuario');


async function agregarUsuario(usuario) {
  try {
    const usuarioAgregado = await UsuarioDAO.agregarUsuario(usuario);
    console.log('Usuario agregado:', usuarioAgregado);
  } catch (error) {
    console.error('Error al agregar usuario:', error);
  }
}


