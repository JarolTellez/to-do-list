const bcrypt = require("bcryptjs");
const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");


class ServicioAuth extends BaseDatabaseHandler {
  constructor({
    Usuario,
    sesionFabrica,
    userService,
    servicioSesion,
    conexionBD,
    usuarioDAO,
    jwtAuth,
    bcrypt,
    crypto,
    NotFoundError,
    ValidationError,
    ConflictError,
   AuthenticationError
  }
    
  ) {
    super(conexionBD);
    this.Usuario = Usuario;
    this.sesionFabrica = sesionFabrica;
    this.userService = userService;
    this.servicioSesion = servicioSesion;
    this.usuarioDAO = usuarioDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
    this.NotFoundError = NotFoundError;
    this.ValidationError = ValidationError;
    this.ConflictError=ConflictError;
    this.AuthenticationError = AuthenticationError
  }

  async registrarUsuario(usuario, externalConn = null) {
    return this.withTransaction(async (connection) => {
     const user= await this.userService.createUser(usuario, connection);
     return user;
    }, externalConn);
  }

  //SEPARAR ESTE METODO
  async loginUsuario(
    refreshTokenExistente,
    nombreUsuario,
    contrasena,
    dispositivoInfo,
    ip,
    externalConn = null
  ) {
    return this.withTransaction(async (connection) => {
      if (!nombreUsuario || !contrasena) {
        const error = new Error(
          "Nombre de usuario y contraseña son requeridos"
        );
        error.statusCode = 400;
        throw error;
      }

     const usuario= await this.userService.validateCredentials(nombreUsuario, contrasena, connection);

      await this.servicioSesion.gestionarLimiteDeSesiones(
        usuario.idUsuario,
        this.MAX_SESIONES,
        connection
      );

      let refreshTokenFinal = null;
      let refreshTokenHash = null;

      if (refreshTokenExistente) {
        console.log("Validando refresh token existente");

        try {
          const decodificado = this.jwtAuth.verificarRefreshToken(
            refreshTokenExistente
          );

          if (decodificado.idUsuario !== usuario.idUsuario) {
            console.log("Refresh token no corresponde al usuario");
            throw new Error("Token inválido");
          }

          refreshTokenHash = this.jwtAuth.generarHash(refreshTokenExistente);
          const sesionValida = await this.servicioSesion.verificarSesionValida(
            usuario.idUsuario,
            refreshTokenHash,
            connection
          );

          if (!sesionValida) {
            throw new Error("Sesión no válida en BD");
          }

          console.log("Refresh token validado exitosamente");
          refreshTokenFinal = refreshTokenExistente;
        } catch (error) {
          console.log("Refresh token inválido:", error.message);
          refreshTokenExistente = null;
        }
      }

      const accessToken = this.jwtAuth.generarAccessToken(
        usuario.idUsuario,
        usuario.rol
      );

      if (!refreshTokenExistente) {
        console.log("Generando nuevo refresh token");

        const { refreshToken, refreshTokenHash: newHash } =
          this.jwtAuth.generarRefreshToken(usuario.idUsuario);

        refreshTokenFinal = refreshToken;
        refreshTokenHash = newHash;

        const dispositivo = `
        ${dispositivoInfo.userAgent || "Unknown"}
        ${dispositivoInfo.screenWidth || "Unknown"}
        ${dispositivoInfo.screenHeight || "Unknown"}
        ${dispositivoInfo.timezone || "Unknown"}
        ${dispositivoInfo.language || "Unknown"}
        ${dispositivoInfo.hardwareConcurrency || "Unknown"}
        ${usuario.idUsuario}
      `;

        const dispositivoId = this.crypto
          .createHash("sha256")
          .update(dispositivo)
          .digest("hex");

        const entidadSesion = this.sesionFabrica.crear(
          usuario.idUsuario,
          refreshTokenHash,
          dispositivoInfo.userAgent || "Unknown",
          ip,
          dispositivoId,
          true
        );

        await this.servicioSesion.registrarSesion(entidadSesion, connection);
        console.log("Nueva sesión registrada");
      }

      return {
        usuario,
        accessToken,
        refreshToken: refreshTokenFinal,
        expiraEn: process.env.EXP_REFRESH_TOKEN,
      };
    }, externalConn);
  }

async logOutSession(refreshToken, externalConn = null) {
  let decoded;
  return this.withTransaction(async (connection) => {
    try {
      decoded = this.jwtAuth.verificarRefreshToken(refreshToken);
    } catch (error) {
      await this.manejarErrorVerificacionToken(error, refreshToken, connection);
      throw new this.AuthenticationError("Token de refresh inválido"); 
    }

    const refreshTokenHashRecibido = this.crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const sesionDesactivada = await this.servicioSesion.deactivateSession(
      decoded.idUsuario, 
      refreshTokenHashRecibido, 
      connection
    );

    if (!sesionDesactivada) {
      throw new this.AuthenticationError("Sesión no encontrada o ya expirada");
    }

    return { 
      success: true, 
      message: 'Sesión cerrada exitosamente',
      usuarioId: decoded.idUsuario 
    };

  }, externalConn);
}

  async renovarAccesToken(refreshToken, externalConn = null) {
    if (!refreshToken) {
      throw this.crearErrorPersonalizado(
        "Refresh Token no proporcionado",
        400,
        "REFRESH_MISSING"
      );
    }
    let decoded;

    return this.withTransaction(async (connection) => {
      try {
        decoded = this.jwtAuth.verificarRefreshToken(refreshToken);
      } catch (error) {
        await this.manejarErrorVerificacionToken(
          error,
          refreshToken,
          connection
        );
        return;
      }

   
       const usuario = await this.userService.validateUserExistenceById(
        decoded.idUsuario,
        connection
      );
      
      const refreshTokenHashRecibido = this.crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
  
        await this.servicioSesion.deactivateSession(
          usuario.idUsuario,
          refreshTokenHashRecibido,
          connection
        );
  
      const nuevoAccessToken = this.jwtAuth.generarAccessToken(
        usuario.idUsuario,
        usuario.rol
      );
      return {
        accessToken: nuevoAccessToken,
        usuario: usuario,
      };
    }, externalConn);
  }

  async manejarErrorVerificacionToken(
    error,
    refreshToken,
    externalConn = null
  ) {
    try {
      const decoded = this.jwtAuth.decodificarToken(refreshToken);

      await this.limpiarSesionInvalidas(
        decoded.idUsuario,
        refreshToken,
        externalConn
      );
    } catch (cleanupError) {
      console.error("Error al limpiar sesión inválida:", cleanupError);
    }

    if (error.message === "Refresh token expirado") {
      throw this.crearErrorPersonalizado(
        "Refresh token expirado",
        401,
        "REFRESH_EXPIRED"
      );
    }

    if (error.message === "Refresh token inválido") {
      throw this.crearErrorPersonalizado(
        "Refresh token inválido",
        401,
        "REFRESH_INVALID"
      );
    }

    throw this.crearErrorPersonalizado("Token inválido", 401, "TOKEN_INVALID");
  }

  async limpiarSesionInvalidas(idUsuario, refreshToken, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const usuario = await this.userService.validateUserExistenceById(
        idUsuario,
        connection
      );

      if (usuario) {
        const refreshTokenHashRecibido = this.crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");

  
        await this.servicioSesion.deactivateSession(
          usuario.idUsuario,
          refreshTokenHashRecibido,
          connection
        );
  
      }
    }, externalConn);
  }

  //CAMBIAR POR ERRORES PERSONALIZADOS
  crearErrorPersonalizado(mensaje, statusCode, tipo) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.tipo = tipo;
    return error;
  }
}

module.exports = ServicioAuth;
