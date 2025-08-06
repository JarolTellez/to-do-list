const bcrypt = require("bcryptjs");

class ServicioUsuario{
   constructor(Usuario, RefreshToken, UsuarioDAO, JwtAuth) {
    this.Usuario = Usuario;
    this.RefreshToken = RefreshToken;
    this.UsuarioDAO = UsuarioDAO;
    this.JwtAuth = JwtAuth;

   }

   async registrarUsuario({ nombreUsuario, correo, contrasena }) {
    const existe = await this.UsuarioDAO.consultarUsuarioPorNombre(nombreUsuario);
    if (existe) {
      const error = new Error("El usuario ya existe");
      error.statusCode = 409;
      throw error;
    }

    const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
    const usuario = new this.Usuario(null, nombreUsuario, correo, contrasenaEncriptada);
    usuario.validar();
    const usuarioAgregado = await this.UsuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    return usuarioAgregado;
  }

   async loginUsuario( nombreUsuario, contrasena ) {
    const usuarioEncontrado = await this.UsuarioDAO.consultarUsuarioPorNombre(nombreUsuario);

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

    const tokenAcceso = this.JwtAuth.generarTokenAcceso(usuarioEncontrado.id_usuario, usuarioEncontrado.rol);
    const refreshToken= this.JwtAuth.generarRefreshToken(usuarioEncontrado.id_usuario);

    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const refreshTokenEntidad = new this.RefreshToken({
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
