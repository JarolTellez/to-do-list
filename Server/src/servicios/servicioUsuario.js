const bcrypt = require("bcryptjs");
const JwtAuth = require('../utils/jwtAuth');
const usuarioDAO = require("../datos/UsuarioDAO");
const Usuario = require("../dominio/Usuario");

class UsuarioService {
  static async registrarUsuario({ nombreUsuario, correo, contrasena }) {
    const existe = await usuarioDAO.consultarUsuarioPorNombre(nombreUsuario);
    if (existe) {
      const error = new Error("El usuario ya existe");
      error.statusCode = 409;
      throw error;
    }

    const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
    const usuario = new Usuario(null, nombreUsuario, correo, contrasenaEncriptada);
    usuario.validar();
    const usuarioAgregado = await usuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    return usuarioAgregado;
  }

  static async loginUsuario({ nombreUsuario, contrasena }) {
    const usuarioEncontrado = await usuarioDAO.consultarUsuarioPorNombre(nombreUsuario);

    if (!usuarioEncontrado) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const esValida = await bcrypt.compare(contrasena.trim(), usuarioEncontrado.contrasena);

    if (!esValida) {
      const error = new Error("Credenciales inválidas");
      error.statusCode = 401;
      throw error;
    }

    const tokenAcceso = JwtAuth.generarTokenAcceso(usuarioEncontrado.id_usuario, usuarioEncontrado.rol);
    const tokenRefresco = JwtAuth.generarRefreshToken(usuarioEncontrado.id_usuario);

    //await guardarRefreshTokenEnBD(usuarioEncontrado.id, tokenRefresco);

    const usuarioRespuesta = {
      idUsuario: usuarioEncontrado.id_usuario,
      nombreUsuario: usuarioEncontrado.nombre_usuario,
      correo: usuarioEncontrado.correo,
      rol: usuarioEncontrado.rol
    };

    return {
      usuario: usuarioRespuesta,
      tokenAcceso,
      tokenRefresco,
      expiraEn: 900 // 15 minutos en segundos
    };
  }
}

module.exports = UsuarioService;
