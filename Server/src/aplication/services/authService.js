class AuthService {
  constructor({
    user,
    userService,
    userMapper,
    sessionService,
    dbManager,
    userDAO,
    jwtAuth,
    bcrypt,
    crypto,
    errorFactory,
    validator,
    appConfig,
    paginationHelper,
    paginationConfig,
  }) {
    this.dbManager = dbManager;
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
    this.paginationHelper = paginationHelper;
    this.paginationConfig = paginationConfig;
  }

  async loginUser(
    { existingRefreshToken, loginRequestDTO, userAgent, ip },
    externalDbClient = null
  ) {
    this.validator.validateRequired(["loginRequestDTO"], {
      loginRequestDTO,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const user = await this.userService.validateCredentials(
        loginRequestDTO,
        dbClient
      );
      const tokenValidation = await this.validateAndReuseRefreshToken(
        existingRefreshToken,
        user,
        dbClient
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
          dbClient
        );
      }

      await this.sessionService.manageSessionLimit(
        user.id,
        this.appConfig.session.maxActive,
        dbClient
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
    }, externalDbClient);
  }

  async logOutUserSession(refreshToken, externalDbClient = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });
    return this.dbManager.withTransaction(async (dbClient) => {
      let decoded;
      try {
        decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      } catch (error) {
        await this.cleanupInvalidSession(refreshToken, dbClient);
        throw this.errorFactory.createAuthenticationError(
          "Refresh Token inválido"
        );
      }

      const refreshTokenHashRecibido =
        this.jwtAuth.createHashRefreshToken(refreshToken);

      const deactivatedSession = await this.sessionService.deactivateSession(
        decoded.sub,
        refreshTokenHashRecibido,
        dbClient
      );

      if (!deactivatedSession.success) {
        throw this.errorFactory.createAuthenticationError(
          "Sesión no encontrada o ya expirada"
        );
      }

      return {
        usuarioId: decoded.sub,
      };
    }, externalDbClient);
  }

  async refreshAccessToken(refreshToken, externalDbClient = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });

    return this.dbManager.withTransaction(async (dbClient) => {
      const decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(refreshToken);
      const sessionValidation = await this.sessionService.validateSession(
        decoded.sub,
        refreshTokenHash,
        dbClient
      );

      if (!sessionValidation) {
        throw this.errorFactory.createAuthenticationError(
          sessionValidation.error || "Sesión inválida"
        );
      }
      const user = await this.userService.validateUserExistenceById(
        decoded.sub,
        dbClient
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
    }, externalDbClient);
  }

  async cleanupInvalidSession(refreshToken, externalDbClient = null) {
    const refreshTokenHash = this.jwtAuth.createHashRefreshToken(refreshToken);
    return this.dbManager.withTransaction(async (dbClient) => {
      await this.sessionService.deactivateSessionByTokenHash(
        refreshTokenHash,
        dbClient
      );
    }, externalDbClient);
  }

  async deactivateSession({ userId, refreshToken }, externalDbClient = null) {
    this.validator.validateRequired(["userId", "refreshToken"], {
      userId,
      refreshToken,
    });
    return this.dbManager.withTransaction(async (dbClient) => {
      const user = await this.userService.validateUserExistenceById(
        userId,
        dbClient
      );

      if (user) {
        const refreshTokenHashRecibido = this.crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");

        await this.sessionService.deactivateSession(
          user.id,
          refreshTokenHashRecibido,
          dbClient
        );
      }
    }, externalDbClient);
  }

  async deactivateAllUserSessions(userId, externalDbClient = null) {
    this.validator.validateRequired(["userId"], { userId });

    return this.dbManager.withTransaction(async (dbClient) => {

      await this.userService.validateUserExistenceById(userId, dbClient);

      const result = await this.sessionService.deactivateAllUserSessions(
        userId,
        dbClient
      );

      return {
        deactivated: result.deactivated,
        userId: userId,
      };
    }, externalDbClient);
  }

  async validateAndReuseRefreshToken(
    existingRefreshToken,
    user,
    externalDbClient = null
  ) {
    if (!existingRefreshToken) {
      return { isValid: false, refreshToken: null, session: null };
    }
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const decoded = this.jwtAuth.verifyRefreshToken(existingRefreshToken);
        const refreshTokenHash =
          this.jwtAuth.createHashRefreshToken(existingRefreshToken);

        if (decoded.sub === user.id) {
          const isValidSession = await this.sessionService.validateSession(
            decoded.sub,
            refreshTokenHash,
            dbClient
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
            dbClient
          );
          return {
            isValid: false,
          };
        }
      } catch (error) {
        // invalid refreshtoken clean session
        const refreshTokenHash =
          this.jwtAuth.createHashRefreshToken(existingRefreshToken);
        await this.sessionService.deactivateSessionByTokenHash(
          refreshTokenHash,
          dbClient
        );
        return {
          isValid: false,
          refreshToken: null,
          session: null,
          isNewToken: true,
        };
      }
    }, externalDbClient);
  }

  async closeSpecificUserSession(
    { refreshToken, targetSessionId },
    externalDbClient = null
  ) {
    this.validator.validateRequired(["refreshToken", "targetSessionId"], {
      refreshToken,
      targetSessionId,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
      const currentUserId = decoded.sub;

      await this.userService.validateUserExistenceById(currentUserId, dbClient);

      const targetSession = await this.sessionService.getSessionById(
        targetSessionId,
        dbClient
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
        dbClient
      );

      if (!result.success) {
        throw this.errorFactory.createNotFoundError(
          "No se pudo cerrar la sesión especificada"
        );
      }

      return {
        sessionId: targetSessionId,
        userId: currentUserId,
      };
    }, externalDbClient);
  }

  async getUserActiveSessions(accessToken, options = {}) {
    this.validator.validateRequired(["accessToken"], { accessToken });
    const decoded = this.jwtAuth.verifyAccessToken(accessToken);
    const currentUserId = decoded.sub;
    const currentSessionId = decoded.sessionId;

    const pagination = this.paginationHelper.calculatePagination(
      options.page,
      options.limit,
      this.paginationConfig.ENTITY_LIMITS.SESSIONS,
      this.paginationConfig.DEFAULT_PAGE,
      this.paginationConfig.DEFAULT_LIMIT
    );

    return this.dbManager.forRead(async (dbClient) => {
      await this.userService.validateUserExistenceById(currentUserId, dbClient);

      const response = await this.sessionService.getAllUserActiveSessions(
        currentUserId,
        currentSessionId,
        {
          page: pagination.page,
          limit: pagination.limit,
          offset: pagination.offset,
          externalDbClient: dbClient,
        }
      );

      return {
        data: response,
      };
    }, options.externalDbClient);
  }
}

module.exports = AuthService;
