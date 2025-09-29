const bcrypt = require("bcryptjs");
const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");
const { LoginRequestDTO } = require("../dtos/request_dto/userRequestDTOs");

class AuthService extends TransactionsHandler {
  constructor({
    user,
    userService,
    userMapper,
    sessionService,
    connectionDB,
    userDAO,
    jwtAuth,
    bcrypt,
    crypto,
    errorFactory,
    validator,
    appConfig,
  }) {
    super(connectionDB);
    this.user = user;
    this.userService = userService;
    this.userMapper = userMapper;
    this.sessionService = sessionService;
    this.userDAO = userDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.appConfig = appConfig;
  }

  async loginUser(
    { existingRefreshToken, loginRequestDTO, userAgent, ip },
    externalConn = null
  ) {
    this.validator.validateRequired(["loginRequestDTO"], {
      loginRequestDTO,
    });

    return this.withTransaction(async (connection) => {
      const user = await this.userService.validateCredentials(
        loginRequestDTO,
        connection
      );
      const tokenValidation = await this.validateAndReuseRefreshToken(
        existingRefreshToken,
        user,
        connection
      );

      let refreshTokenToUse = null;
      let session = null;
      let isNewRefreshToken = true;

      if (tokenValidation.isValid) {
        refreshTokenToUse = tokenValidation.refreshToken;
        session = tokenValidation.session;
        isNewRefreshToken = tokenValidation.isNewToken;
      }

      // if there is no valid token, create new one
      if (!refreshTokenToUse) {
        refreshTokenToUse = this.jwtAuth.createRefreshToken(user.id);
        const refreshTokenHash =
          this.jwtAuth.createHashRefreshToken(refreshTokenToUse);

        session = await this.sessionService.createNewSession(
          {
            userId: user.id,
            refreshTokenHash,
            userAgent,
            ip,
          },
          connection
        );
      }

      await this.sessionService.manageSessionLimit(
        user.id,
        this.appConfig.session.maxActive,
        connection
      );

      const accessToken = this.jwtAuth.createAccessToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
        sessionId: session.id,
      });

      const authResponse = this.userMapper.domainToAuthResponse({
        userDomain: user,
        accessToken,
        expiresIn: this.appConfig.jwt.access.expiresIn,
        expiresAt: session.expiresAt,
      });

      return {
        authResponse,
        refreshToken: refreshTokenToUse,
        isNewRefreshToken: isNewRefreshToken,
      };
    }, externalConn);
  }

  async logOutUserSession(refreshToken, externalConn = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });
    return this.withTransaction(async (connection) => {
      let decoded;
      try {
        decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      } catch (error) {
        await this.cleanupInvalidSession(refreshToken, connection);
        throw this.errorFactory.createAuthenticationError(
          "Refresh Token inválido"
        );
      }

      const refreshTokenHashRecibido =
        this.jwtAuth.createHashRefreshToken(refreshToken);

      const deactivatedSession = await this.sessionService.deactivateSession(
        decoded.sub,
        refreshTokenHashRecibido,
        connection
      );

      if (!deactivatedSession.success) {
        throw this.errorFactory.createAuthenticationError(
          "Sesión no encontrada o ya expirada"
        );
      }

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
        usuarioId: decoded.sub,
      };
    }, externalConn);
  }

  async refreshAccessToken(refreshToken, externalConn = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });

    return this.withTransaction(async (connection) => {
      const decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(refreshToken);
      const sessionValidation = await this.sessionService.validateSession(
        decoded.sub,
        refreshTokenHash,
        connection
      );

      if (!sessionValidation) {
        throw this.errorFactory.createAuthenticationError(
          sessionValidation.error || "Sesión inválida"
        );
      }
      const user = await this.userService.validateUserExistenceById(
        decoded.sub,
        connection
      );

      const accessToken = this.jwtAuth.createAccessToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
        sessionId: sessionValidation.id,
      });

      return {
        accessToken: accessToken,
        expiresIn: this.appConfig.jwt.access.expiresIn,
        tokenType: "Bearer",
      };
    }, externalConn);
  }

  async cleanupInvalidSession(refreshToken, connection) {
    try {
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(refreshToken);
      await this.sessionService.deactivateSessionByTokenHash(
        refreshTokenHash,
        connection
      );
    } catch (error) {
      console.error("Error limpiando sesión inválida:", error.message);
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

  async closeAllUserSessions(accessToken, externalConn = null) {
    this.validator.validateRequired(["accessToken"], { accessToken });

    return this.withTransaction(async (connection) => {
      const decoded = this.jwtAuth.verifyAccessToken(accessToken);
      const userId = decoded.sub;

      await this.userService.validateUserExistenceById(userId, connection);

      const result = await this.sessionService.deactivateAllUserSessions(
        userId,
        connection
      );

      return {
        success: true,
        message: `Todas las sesiones cerradas (${result.deactivated} sesiones)`,
        deactivated: result.deactivated,
        userId: userId,
      };
    }, externalConn);
  }

  async validateAndReuseRefreshToken(existingRefreshToken, user, connection) {
    if (!existingRefreshToken) {
      return { isValid: false, refreshToken: null, session: null };
    }
    try {
      const decoded = this.jwtAuth.verifyRefreshToken(existingRefreshToken);
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(existingRefreshToken);

      if (decoded.sub === user.id) {
        const isValidSession = await this.sessionService.validateSession(
          decoded.sub,
          refreshTokenHash,
          connection
        );

        if (isValidSession) {
          return {
            isValid: true,
            refreshToken: existingRefreshToken,
            session: isValidSession,
            isNewToken: false,
          };
        }
      } else {
        // token belongs to another user deactivating for security
        await this.sessionService.deactivateSession(
          decoded.sub,
          refreshTokenHash,
          connection
        );
      }
    } catch (error) {
      // invalid refreshtoken clean session
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(existingRefreshToken);
      await this.sessionService.deactivateSessionByTokenHash(
        refreshTokenHash,
        connection
      );
    }

    return {
      isValid: false,
      refreshToken: null,
      session: null,
      isNewToken: true,
    };
  }

  async closeSpecificUserSession(
    refreshToken,
    targetSessionId,
    externalConn = null
  ) {
    this.validator.validateRequired(["refreshToken", "targetSessionId"], {
      refreshToken,
      targetSessionId,
    });

    return this.withTransaction(async (connection) => {
      const decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      const currentUserId = decoded.sub;

      await this.userService.validateUserExistenceById(
        currentUserId,
        connection
      );

      const targetSession = await this.sessionService.findSessionById(
        targetSessionId,
        connection
      );

      if (!targetSession) {
        throw this.errorFactory.createNotFoundError("Sesión no encontrada");
      }

      if (targetSession.userId !== currentUserId) {
        throw this.errorFactory.createAuthorizationError(
          "No tienes permisos para cerrar esta sesión"
        );
      }

      // Verify that the session belongs to the same user
      const currentRefreshTokenHash =
        this.jwtAuth.createHashRefreshToken(refreshToken);
      if (targetSession.refreshTokenHash === currentRefreshTokenHash) {
        throw this.errorFactory.createConflictError(
          "No puedes cerrar tu sesión actual con este método. Usa logOutUserSession."
        );
      }

      const result = await this.sessionService.deactivateSpecificSession(
        targetSessionId,
        currentUserId,
        connection
      );

      if (!result.success) {
        throw this.errorFactory.createNotFoundError(
          "No se pudo cerrar la sesión especificada"
        );
      }

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
        sessionId: targetSessionId,
        userId: currentUserId,
      };
    }, externalConn);
  }

  async findUserActiveSessions(accessToken, externalConn = null) {
    this.validator.validateRequired(["accessToken"], { accessToken });

    return this.withTransaction(async (connection) => {
      const decoded = this.jwtAuth.verifyAccessToken(accessToken);
      const currentUserId = decoded.sub;

      await this.userService.validateUserExistenceById(
        currentUserId,
        connection
      );

      const currentSessionId = decoded.sessionId;

      const sessionsResponse =
        await this.sessionService.findAllUserActiveSessions(
          currentUserId,
          currentSessionId,
          connection
        );

      return {
        sessions: sessionsResponse,
        total: sessionsResponse.length,
        message: "Sesiones activas obtenidas correctamente",
      };
    }, externalConn);
  }
}

module.exports = AuthService;
