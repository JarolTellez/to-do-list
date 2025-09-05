const bcrypt = require('bcryptjs');
const BaseDatabaseHandler = require('../../infraestructura/config/BaseDatabaseHandler');

class AuthService extends BaseDatabaseHandler {
  constructor({
    user,
    sessionFactory,
    userService,
    sessionService,
    connectionDB,
    userDAO,
    jwtAuth,
    bcrypt,
    crypto,
    NotFoundError,
    ValidationError,
    ConflictError,
    AuthenticationError,
    validateRequired,
  }) {
    super(connectionDB);
    this.user = user;
    this.sessionFactory = sessionFactory;
    this.userService = userService;
    this.sessionService = sessionService;
    this.userDAO = userDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
    this.NotFoundError = NotFoundError;
    this.ValidationError = ValidationError;
    this.ConflictError = ConflictError;
    this.AuthenticationError = AuthenticationError;
    this.validateRequired = validateRequired;
  }

  async registrarUsuario(user, externalConn = null) {
    this.validateRequired(['user'], { user });
    return this.withTransaction(async (connection) => {
      const user = await this.userService.createUser(user, connection);
      return user;
    }, externalConn);
  }

  //SEPARAR ESTE METODO
  async loginUser(
    existingRefreshToken,
    userName,
    password,
    deviceInfo,
    ip,
    externalConn = null
  ) {
    this.validateRequired(['userName', 'password'], {
      userName,
      password,
    });
    return this.withTransaction(async (connection) => {
      const user = await this.userService.validateCredentials(
        userName,
        password,
        connection
      );

      await this.sessionService.gestionarLimiteDeSesiones(
        user.idUsuario,
        this.MAX_SESIONES,
        connection
      );

      let refreshTokenFinal = null;
      let refreshTokenHash = null;

      if (existingRefreshToken) {
        console.log('Validando refresh token existente');

        try {
          const decodificado = this.jwtAuth.verificarRefreshToken(
            existingRefreshToken
          );

          if (decodificado.idUsuario !== user.idUsuario) {
            console.log('Refresh token no corresponde al user');
            throw new Error('Token inválido');
          }

          refreshTokenHash = this.jwtAuth.generarHash(existingRefreshToken);
          const sesionValida = await this.sessionService.verificarSesionValida(
            user.idUsuario,
            refreshTokenHash,
            connection
          );

          if (!sesionValida) {
            throw new Error('Sesión no válida en BD');
          }

          console.log('Refresh token validado exitosamente');
          refreshTokenFinal = existingRefreshToken;
        } catch (error) {
          console.log('Refresh token inválido:', error.message);
          existingRefreshToken = null;
        }
      }

      const accessToken = this.jwtAuth.generarAccessToken(
        user.idUsuario,
        user.rol
      );

      if (!existingRefreshToken) {
        console.log('Generando nuevo refresh token');

        const { refreshToken, refreshTokenHash: newHash } =
          this.jwtAuth.generarRefreshToken(user.idUsuario);

        refreshTokenFinal = refreshToken;
        refreshTokenHash = newHash;

        const dispositivo = `
        ${deviceInfo.userAgent || 'Unknown'}
        ${deviceInfo.screenWidth || 'Unknown'}
        ${deviceInfo.screenHeight || 'Unknown'}
        ${deviceInfo.timezone || 'Unknown'}
        ${deviceInfo.language || 'Unknown'}
        ${deviceInfo.hardwareConcurrency || 'Unknown'}
        ${user.idUsuario}
      `;

        const dispositivoId = this.crypto
          .createHash('sha256')
          .update(dispositivo)
          .digest('hex');

        const entidadSesion = this.sessionFactory.crear(
          user.idUsuario,
          refreshTokenHash,
          deviceInfo.userAgent || 'Unknown',
          ip,
          dispositivoId,
          true
        );

        await this.sessionService.registrarSesion(entidadSesion, connection);
        console.log('Nueva sesión registrada');
      }

      return {
        user,
        accessToken,
        refreshToken: refreshTokenFinal,
        expiraEn: process.env.EXP_REFRESH_TOKEN,
      };
    }, externalConn);
  }

  async logOutSession(refreshToken, externalConn = null) {
    this.validateRequired(['refreshToken'], { refreshToken });
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
        throw new this.AuthenticationError('Token de refresh inválido');
      }

      const refreshTokenHashRecibido = this.crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const sesionDesactivada = await this.sessionService.deactivateSession(
        decoded.idUsuario,
        refreshTokenHashRecibido,
        connection
      );

      if (!sesionDesactivada) {
        throw new this.AuthenticationError(
          'Sesión no encontrada o ya expirada'
        );
      }

      return {
        success: true,
        message: 'Sesión cerrada exitosamente',
        usuarioId: decoded.idUsuario,
      };
    }, externalConn);
  }

  async renovarAccesToken(refreshToken, externalConn = null) {
    this.validateRequired(['refreshToken'], { refreshToken });
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

      const user = await this.userService.validateUserExistenceById(
        decoded.idUsuario,
        connection
      );

      const refreshTokenHashRecibido = this.crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await this.sessionService.deactivateSession(
        user.idUsuario,
        refreshTokenHashRecibido,
        connection
      );

      const nuevoAccessToken = this.jwtAuth.generarAccessToken(
        user.idUsuario,
        user.rol
      );
      return {
        accessToken: nuevoAccessToken,
        user: user,
      };
    }, externalConn);
  }

  async manejarErrorVerificacionToken(
    error,
    refreshToken,
    externalConn = null
  ) {
    try {
      this.validateRequired(['refreshToken'], {refreshToken});
      const decoded = this.jwtAuth.decodificarToken(refreshToken);
      await this.limpiarSesionInvalidas(
        decoded.idUsuario,
        refreshToken,
        externalConn
      );
    } catch (cleanupError) {
      console.error('Error al limpiar sesión inválida:', cleanupError);
    }

    // if (error.message === 'Refresh token expirado') {
    //   throw this.crearErrorPersonalizado(
    //     'Refresh token expirado',
    //     401,
    //     'REFRESH_EXPIRED'
    //   );
    // }

    // if (error.message === 'Refresh token inválido') {
    //   throw this.crearErrorPersonalizado(
    //     'Refresh token inválido',
    //     401,
    //     'REFRESH_INVALID'
    //   );
    // }

    // throw this.crearErrorPersonalizado('Token inválido', 401, 'TOKEN_INVALID');
  }

  async limpiarSesionInvalidas(idUsuario, refreshToken, externalConn = null) {
    this.validateRequired(['userId','refreshToken'],{idUsuario, refreshToken});
    return this.withTransaction(async (connection) => {
      const user = await this.userService.validateUserExistenceById(
        idUsuario,
        connection
      );

      if (user) {
        const refreshTokenHashRecibido = this.crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex');

        await this.sessionService.deactivateSession(
          user.idUsuario,
          refreshTokenHashRecibido,
          connection
        );
      }
    }, externalConn);
  }

}

module.exports = AuthService;
