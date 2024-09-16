const UsuarioDAO = require('../datos/UsuarioDAO');


async function agregarUsuario(usuario) {
  try {
    const usuario = await UsuarioDAO.agregar(usuario);
    console.log('Usuario agregado:', usuario);
  } catch (error) {
    console.error('Error al agregar usuario:', error);
  }
}

