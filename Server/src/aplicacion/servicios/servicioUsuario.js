const bcrypt = require("bcryptjs");
const JwtAuth = require('../../infraestructura/config/jwtAuth');
const usuarioDAO = require("../../infraestructura/daos/UsuarioDAO");
const RefreshTokensDAO = require("../../infraestructura/daos/refreshTokensDAO");
const Usuario = require("../../dominio/entidades/Usuario");
const RefreshToken = require ("../../dominio/entidades/refreshToken");

class ServicioUsuario{
   constructor(usuarioDAO) {
    this.usuarioDAO = usuarioDAO;
   }

   async registrarUsuario({ nombreUsuario, correo, contrasena }) {
    const existe = await this.usuarioDAO.consultarUsuarioPorNombre(nombreUsuario);
    if (existe) {
      const error = new Error("El usuario ya existe");
      error.statusCode = 409;
      throw error;
    }

    const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
    const usuario = new Usuario(null, nombreUsuario, correo, contrasenaEncriptada);
    usuario.validar();
    const usuarioAgregado = await this.usuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    return usuarioAgregado;
  }

   async loginUsuario( nombreUsuario, contrasena ) {
    const usuarioEncontrado = await this.usuarioDAO.consultarUsuarioPorNombre(nombreUsuario);

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
    const refreshToken= JwtAuth.generarRefreshToken(usuarioEncontrado.id_usuario);

    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const refreshTokenEntidad = new RefreshToken({
      idRefreshToken: null,
      idUsuario: usuarioEncontrado.id_usuario,
      token: refreshToken,
      fechaCreacion: fechaCreacion,
      fechaExpiracion: fechaExpiracion,
      revocado: false
   });
// HABILOTAR DESPUES
    //await RefreshTokensDAO.guardarRefreshToken(refreshTokenEntidad);

    const usuarioRespuesta = {
      idUsuario: usuarioEncontrado.id_usuario,
      nombreUsuario: usuarioEncontrado.nombre_usuario,
      correo: usuarioEncontrado.correo,
      rol: usuarioEncontrado.rol
    };

    return {
      usuario: usuarioRespuesta,
      tokenAcceso,
      refreshToken,
      expiraEn: 900 // 15 minutos en segundos
    };
  }
}

module.exports = ServicioUsuario;
