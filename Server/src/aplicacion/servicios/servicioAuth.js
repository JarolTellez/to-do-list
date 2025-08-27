const bcrypt = require("bcryptjs");

class ServicioAuth{
   constructor(Usuario, SesionFabrica,servicioSesion, UsuarioDAO, jwtAuth, bcrypt, crypto) {
    this.Usuario = Usuario;
    this.SesionFabrica = SesionFabrica;
    this.servicioSesion = servicioSesion;
    this.UsuarioDAO = UsuarioDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
   }

   async registrarUsuario(usuario) {
    const existe = await this.UsuarioDAO.consultarUsuarioPorNombre(usuario.nombreUsuario);
    if (existe) {
      const error = new Error("El usuario ya existe");
      error.statusCode = 409;
      throw error;
    }

    const contrasenaEncriptada = await this.bcrypt.hash(usuario.contrasena, 10);
    usuario.contrasena=contrasenaEncriptada;
    // const usuario = new this.Usuario(null, nombreUsuario, correo, contrasenaEncriptada);
    usuario.validar();
    const usuarioAgregado = await this.UsuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    return usuarioAgregado;
  }


  async loginUsuario(nombreUsuario, contrasena, dispositivoInfo, ip) {
  // Verificar el usuario
  const usuarioEncontrado = await this.UsuarioDAO.consultarUsuarioPorNombreContrasena(
    nombreUsuario,
    contrasena
  );

  if (!usuarioEncontrado) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  await this.servicioSesion.gestionarLimiteDeSesiones(
    usuarioEncontrado.idUsuario,
    this.MAX_SESIONES
  );

 // Generar tokens 
  const tokenAcceso = this.jwtAuth.generarTokenAcceso(
    usuarioEncontrado.idUsuario,
    usuarioEncontrado.rol
  );
  
  const { refreshToken, refreshTokenHash } = this.jwtAuth.generarRefreshToken(
    usuarioEncontrado.idUsuario
  );

  // Crear deviceId ya con la validacion de que el usuario existe(codigo arriba)
  const dispositivo = `
    ${dispositivoInfo.userAgent}
    ${dispositivoInfo.screenWidth}
    ${dispositivoInfo.screenHeight}
    ${dispositivoInfo.timezone}
    ${dispositivoInfo.language}
    ${dispositivoInfo.hardwareConcurrency || "unknown"}
    ${usuarioEncontrado.idUsuario}
  `;

  const dispositivoId = this.crypto
    .createHash("sha256")
    .update(dispositivo)
    .digest("hex");

  //Crear y registrar la sesión
  const entidadSesion = this.SesionFabrica.crear(
    usuarioEncontrado.idUsuario,
    refreshTokenHash, 
    dispositivoInfo.userAgent,
    ip,
    dispositivoId
  );

  await this.servicioSesion.registrarSesion(entidadSesion);

  return {
    usuario: usuarioEncontrado,
   tokenAcceso: tokenAcceso,
   refreshToken: refreshToken, 
    expiraEn: 900,
  };
}

  async renovarTokenAcceso(refreshToken){

  }
}

module.exports = ServicioAuth;
