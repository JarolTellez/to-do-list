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
  const accessToken= this.jwtAuth.generarAccessToken(
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
    dispositivoId,
    true
  );

  await this.servicioSesion.registrarSesion(entidadSesion);

  return {
    usuario: usuarioEncontrado,
   accessToken: accessToken,
   refreshToken: refreshToken, 
    expiraEn: 900,
  };
}

  async renovarAccesToken(refreshToken){

    try {
      if(!refreshToken){
        throw new Error("Refresh Token no proporcionado")
      }

      const decodificado= this.jwtAuth.verificarRefreshToken(refreshToken);

      console.log("DECODIFICADO EALEEEEEEEEEEEE:", decodificado)
;      const usuario = await this.UsuarioDAO.consultarUsuarioPorId(decodificado.idUsuario);
     // console.log("USUARIO:", usuario,"REFRESH TOKEN", refreshToken);

      if(!usuario){
          throw new Error("Usuario no encontrado");
      }
      
      const refreshTokenHashRecibido = this.crypto.createHash('sha256').update(refreshToken).digest('hex');

      const sesionValida = await this.servicioSesion.verificarSesionValida(usuario.idUsuario, refreshTokenHashRecibido);
      if(new Date()> sesionValida.fechaExpiracion){
        await this.servicioSesion.desactivarSesion(sesionValida.idSesion);
      }

      const nuevoAccesToken = this.jwtAuth.generarAccessToken(
    usuario.idUsuario,
    usuario.rol
  );

  console.log("ACCES TOKEN: ", nuevoAccesToken, "USUARIO: ",usuario);

  return {
    accessToken: nuevoAccesToken,
    usuario: usuario,
  }
  
    } catch (error) {
     if (error.message === 'Refresh token expirado') {
            const customError = new Error('Refresh token expirado');
            customError.statusCode = 401;
            customError.tipo = 'REFRESH_EXPIRED';
            throw customError;
        }
        
        if (error.message === 'Refresh token inválido') {
            const customError = new Error('Refresh token inválido');
            customError.statusCode = 401;
            customError.tipo = 'REFRESH_INVALID';
            throw customError;
        }

       
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            const customError = new Error('Token inválido');
            customError.statusCode = 401;
            customError.tipo = 'TOKEN_INVALID';
            throw customError;
        }

        throw error;
      
     }
  }
}

module.exports = ServicioAuth;
