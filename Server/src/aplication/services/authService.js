const bcrypt = require("bcryptjs");
const BaseDatabaseHandler = require("../../infrastructure/config/BaseDatabaseHandler");

class AuthService extends BaseDatabaseHandler {
  constructor({
    user,
    userService,
    sessionService,
    connectionDB,
    userDAO,
    jwtAuth,
    bcrypt,
    crypto,
    errorFactory,
    validator,
  }) {
    super(connectionDB);
    this.user = user;
    this.userService = userService;
    this.sessionService = sessionService;
    this.userDAO = userDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
    this.errorFactory = errorFactory;
    this.validator = validator;
  }

  async createUser(user, externalConn = null) {
    this.validator.validateRequired(["user"], { user });
    return this.withTransaction(async (connection) => {
      const newUser = await this.userService.createUser(user, connection);
      return newUser;
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
    this.validator.validateRequired(["userName", "password"], {
      userName,
      password,
    });
    return this.withTransaction(async (connection) => {
      const user = await this.userService.validateCredentials(
        userName,
        password,
        connection
      );

      await this.sessionService.manageSessionLimit(
        user.id,
        this.MAX_SESIONES,
        connection
      );

      let refreshTokenFinal = null;
      let refreshTokenHash = null;

      if (existingRefreshToken) {
        try {
          const decodificado =
            this.jwtAuth.verifyRefreshToken(existingRefreshToken);

          if (decodificado.userId !== user.id) {
            throw new Error("Token inválido");
          }

          refreshTokenHash = this.jwtAuth.createHash(existingRefreshToken);
          const sesionValida = await this.sessionService.verifyValidSession(
            user.id,
            refreshTokenHash,
            connection
          );

          if (!sesionValida) {
            throw new Error("Sesión no válida en BD");
          }

          refreshTokenFinal = existingRefreshToken;
        } catch (error) {
          existingRefreshToken = null;
        }
      }

      const accessToken = this.jwtAuth.createAccessToken(user.id, user.rol);

      if (!existingRefreshToken) {
        const { refreshToken, refreshTokenHash: newHash } =
          this.jwtAuth.createRefreshToken(user.id);

        refreshTokenFinal = refreshToken;
        refreshTokenHash = newHash;

        const dispositivo = `
        ${deviceInfo.userAgent || "Unknown"}
        ${deviceInfo.screenWidth || "Unknown"}
        ${deviceInfo.screenHeight || "Unknown"}
        ${deviceInfo.timezone || "Unknown"}
        ${deviceInfo.language || "Unknown"}
        ${deviceInfo.hardwareConcurrency || "Unknown"}
        ${user.id}
      `;

        const deviceId = this.crypto
          .createHash("sha256")
          .update(dispositivo)
          .digest("hex");

        // const entidadSesion = this.sessionFactory.crear(
        //   user.id,
        //   refreshTokenHash,
        //   deviceInfo.userAgent || "Unknown",
        //   ip,
        //   deviceId,
        //   true
        // );

        await this.sessionService.createSession(entidadSesion, connection);
        console.log("Nueva sesión registrada");
      }

      return {
        user,
        accessToken,
        refreshToken: refreshTokenFinal,
        expiraEn: process.env.EXP_REFRESH_TOKEN,
      };
    }, externalConn);
  }

  async logOutUser(refreshToken, externalConn = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });
    let decoded;
    return this.withTransaction(async (connection) => {
      try {
        decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      } catch (error) {
        await this.manageVerificationTokenError(
          error,
          refreshToken,
          connection
        );
        throw this.errorFactory.createAuthenticationError(
          "Token de refresh inválido"
        );
      }

      const refreshTokenHashRecibido = this.crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      const deactivatedSession = await this.sessionService.deactivateSession(
        decoded.userId,
        refreshTokenHashRecibido,
        connection
      );

      if (!deactivatedSession) {
        throw this.errorFactory.createAuthenticationError(
          "Sesión no encontrada o ya expirada"
        );
      }

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
        usuarioId: decoded.userId,
      };
    }, externalConn);
  }

  async refreshAccessToken(refreshToken, externalConn = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });
    let decoded;

    return this.withTransaction(async (connection) => {
      try {
        decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      } catch (error) {
        await this.manageVerificationTokenError(
          error,
          refreshToken,
          connection
        );
        return;
      }

      const user = await this.userService.validateUserExistenceById(
        decoded.userId,
        connection
      );

      const refreshTokenHashRecibido = this.crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await this.sessionService.deactivateSession(
        user.id,
        refreshTokenHashRecibido,
        connection
      );

      const nuevoAccessToken = this.jwtAuth.createAccessToken(
        user.id,
        user.rol
      );
      return {
        accessToken: nuevoAccessToken,
        user: user,
      };
    }, externalConn);
  }

  async manageVerificationTokenError(error, refreshToken, externalConn = null) {
    try {
      this.validator.validateRequired(["refreshToken"], { refreshToken });
      const decoded = this.jwtAuth.decodeToken(refreshToken);
      await this.deactivateSession(decoded.userId, refreshToken, externalConn);
    } catch (cleanupError) {
      console.error("Error al limpiar sesión inválida:", cleanupError);
    }
  }

  async deactivateSession(idUsuario, refreshToken, externalConn = null) {
    this.validator.validateRequired(["userId", "refreshToken"], {
      idUsuario,
      refreshToken,
    });
    return this.withTransaction(async (connection) => {
      const user = await this.userService.validateUserExistenceById(
        idUsuario,
        connection
      );

      if (user) {
        const refreshTokenHashRecibido = this.crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");

        await this.sessionService.deactivateSession(
          user.id,
          refreshTokenHashRecibido,
          connection
        );
      }
    }, externalConn);
  }
}

module.exports = AuthService;
