const bcrypt = require("bcryptjs");
const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class ServicioAuth extends BaseDatabaseHandler {
  constructor(
    Usuario,
    SesionFabrica,
    servicioSesion,
    conexionBD,
    UsuarioDAO,
    jwtAuth,
    bcrypt,
    crypto,
    NotFoundError
  ) {
    super(conexionBD);
    this.Usuario = Usuario;
    this.SesionFabrica = SesionFabrica;
    this.servicioSesion = servicioSesion;
    this.UsuarioDAO = UsuarioDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
    this.NotFoundError = NotFoundError;
  }

  async registrarUsuario(usuario, externalConn = null) {
    return this.withTransaction(async (connection) => {
      // Verificar si el usuario ya existe
      const usuarioExistente = await this.UsuarioDAO.consultarUsuarioPorNombre(
        usuario.nombreUsuario,
        connection
      );

      if (usuarioExistente) {
        throw new Error("El usuario ya existe");
      }

   
      const contrasenaEncriptada = await this.bcrypt.hash(
        usuario.contrasena,
        10
      );
      usuario.contrasena = contrasenaEncriptada;

      usuario.validar();
      const usuarioAgregado = await this.UsuarioDAO.agregarUsuario(
        usuario,
        connection
      );
      return usuarioAgregado;
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

      console.log("Verificando credenciales para usuario:", nombreUsuario);

      const usuario = await this.UsuarioDAO.consultarUsuarioPorNombreContrasena(
        nombreUsuario,
        contrasena,
        connection
      );

      if (!usuario) {
        console.log("Usuario no encontrado:", nombreUsuario);
        const error = new Error("Credenciales inválidas");
        error.statusCode = 401;
        throw error;
      }

      console.log("Usuario autenticado:", usuario.idUsuario);

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

        const entidadSesion = this.SesionFabrica.crear(
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

      const usuario = await this.UsuarioDAO.consultarUsuarioPorId(
        decoded.idUsuario,
        connection
      );
      if (!usuario) {
        throw this.crearErrorPersonalizado(
          "Usuario no encontrado",
          404,
          "USER_NOT_FOUND"
        );
      }

      const refreshTokenHashRecibido = this.crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
      const sesionValida = await this.servicioSesion.verificarSesionValida(
        usuario.idUsuario,
        refreshTokenHashRecibido,
        connection
      );

      if (!sesionValida) {
        throw this.crearErrorPersonalizado(
          "Sesión no válida",
          401,
          "INVALID_SESSION"
        );
      }

      if (new Date() > new Date(sesionValida.fechaExpiracion)) {
        await this.servicioSesion.desactivarSesion(
          sesionValida.idSesion,
          connection
        );
        throw this.crearErrorPersonalizado(
          "Sesión expirada",
          401,
          "SESSION_EXPIRED"
        );
      }

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
      const usuario = await this.UsuarioDAO.consultarUsuarioPorId(
        idUsuario,
        connection
      );

      if (usuario) {
        const refreshTokenHashRecibido = this.crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");

        const sesion = await this.servicioSesion.verificarSesionValida(
          usuario.idUsuario,
          refreshTokenHashRecibido,
          connection
        );

        if (sesion) {
          await this.servicioSesion.desactivarSesion(
            sesion.idSesion,
            connection
          );
        }
      }
    }, externalConn);
  }

  crearErrorPersonalizado(mensaje, statusCode, tipo) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.tipo = tipo;
    return error;
  }
}

module.exports = ServicioAuth;
