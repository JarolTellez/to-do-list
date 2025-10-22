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
    sortValidator,
    appConfig,
    paginationHelper,
    paginationConfig,
    errorMapper,
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
    this.sortValidator = sortValidator;
    this.appConfig = appConfig;
    this.paginationHelper = paginationHelper;
    this.paginationConfig = paginationConfig;
    this.errorMapper = errorMapper;
  }

  async loginUser(
    { existingRefreshToken, loginRequestDTO, userAgent, ip },
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
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

          if (!session) {
            throw this.errorFactory.createDatabaseError(
              "Error al crear la sesión de usuario",
              {
                userId: user.id,
                operation: "loginUser",
              }
            );
          }
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

        return {
          userDomain: user,
          accessToken,
          expiresIn: this.appConfig.jwt.access.expiresIn,
          expiresAt: session.expiresAt,
          refreshToken: refreshTokenToUse,
          isNewRefreshToken: isNewRefreshToken,
        };
      }, externalDbClient);
    });
  }

  async logOutUserSession(refreshToken, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["refreshToken"], { refreshToken });
      return this.dbManager.withTransaction(async (dbClient) => {
        let decoded;
        try {
          decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
        } catch (error) {
          await this.cleanupInvalidSession(refreshToken, dbClient);
          throw this.errorFactory.createAuthenticationError(
            "Refresh token invalido",
            {
              operation: "logOutUserSession",
              tokenType: "refresh",
            }
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
            "Sesión no encontrada o ya expirada",
            {
              userId: decoded.sub,
              operation: "logOutUserSession",
            }
          );
        }

        return {
          usuarioId: decoded.sub,
          sessionId: deactivatedSession.sessionId,
        };
      }, externalDbClient);
    });
  }

  async verifyUserSession(
    { accessToken, refreshToken },
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      if (!refreshToken) {
        return {
          isAuthenticated: false,
          user: null,
          newAccessToken: null,
        };
      }

      return this.dbManager.withTransaction(async (dbClient) => {
        let userData = null;
        let newAccessToken = null;

        try {
          if (accessToken) {
            try {
              const decoded = this.jwtAuth.verifyAccessToken(accessToken);

              userData = await this.userService.validateUserExistenceById(
                decoded.sub,
                dbClient
              );
              const sessionValidation =
                await this.sessionService.validateSession(
                  decoded.sub,
                  this.jwtAuth.createHashRefreshToken(refreshToken),
                  dbClient
                );
              if (!sessionValidation) {
                throw this.errorFactory.createAuthenticationError(
                  "Session no encontrada o inactiva",
                  {
                    operation: "verifyUserSession",
                  }
                );
              }
            } catch (accessTokenError) {
              if (
                accessTokenError.name === "TokenExpiredError" ||
                accessTokenError.name === "JsonWebTokenError"
              ) {
                const refreshResult = await this.refreshAccessToken(
                  refreshToken,
                  dbClient
                );
                userData = refreshResult.user;
                newAccessToken = refreshResult.accessToken;
              } else {
                throw accessTokenError;
              }
            }
          } else {
            const refreshResult = await this.refreshAccessToken(
              refreshToken,
              dbClient
            );
            userData = refreshResult.user;
            newAccessToken = refreshResult.accessToken;
          }

          return {
            isAuthenticated: true,
            user: userData,
            newAccessToken: newAccessToken,
          };
        } catch (error) {
          return {
            isAuthenticated: false,
            user: null,
            newAccessToken: null,
          };
        }
      }, externalDbClient);
    });
  }

  async refreshAccessToken(refreshToken, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
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
            "Sesión inválida o expirada",
            {
              userId: decoded.sub,
              operation: "refreshAccessToken",
            }
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
          user,
          expiresIn: this.appConfig.jwt.access.expiresIn,
          tokenType: "Bearer",
          sessionId: sessionValidation.id,
        };
      }, externalDbClient);
    });
  }

  async cleanupInvalidSession(refreshToken, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["refreshToken"], { refreshToken });
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(refreshToken);
      return this.dbManager.withTransaction(async (dbClient) => {
        const result = await this.sessionService.deactivateSessionByTokenHash(
          refreshTokenHash,
          dbClient
        );
        return {
          cleaned: true,
          sessionId: result.sessionId,
        };
      }, externalDbClient);
    });
  }

  async deactivateSession({ userId, refreshToken }, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId", "refreshToken"], {
        userId,
        refreshToken,
      });
      return this.dbManager.withTransaction(async (dbClient) => {
        const user = await this.userService.validateUserExistenceById(
          userId,
          dbClient
        );

        const refreshTokenHashRecibido =
          this.jwtAuth.createHashRefreshToken(refreshToken);

        const result = await this.sessionService.deactivateSession(
          user.id,
          refreshTokenHashRecibido,
          dbClient
        );

        if (!result.success) {
          throw this.errorFactory.createAuthenticationError(
            "No se pudo desactivar la sesión",
            {
              userId: user.id,
              operation: "deactivateSession",
            }
          );
        }

        return {
          success: true,
          userId: user.id,
          sessionId: result.sessionId,
        };
      }, externalDbClient);
    });
  }

  async deactivateAllUserSessions(userId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
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
    });
  }

  async validateAndReuseRefreshToken(
    existingRefreshToken,
    user,
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
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
              refreshToken: null,
              session: null,
              isNewToken: true,
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

        return {
          isValid: false,
          refreshToken: null,
          session: null,
          isNewToken: true,
        };
      }, externalDbClient);
    });
  }

  async closeSpecificUserSession(
    { refreshToken, targetSessionId },
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["refreshToken", "targetSessionId"], {
        refreshToken,
        targetSessionId,
      });

      return this.dbManager.withTransaction(async (dbClient) => {
        let decoded;
        try {
          decoded = this.jwtAuth.verifyRefreshToken(refreshToken);
        } catch (error) {
          throw this.errorFactory.createAuthenticationError(
            "Refresh Token inválido",
            {
              operation: "closeSpecificUserSession",
              tokenType: "refresh",
            }
          );
        }
        const currentUserId = decoded.sub;

        await this.userService.validateUserExistenceById(
          currentUserId,
          dbClient
        );

        const targetSession = await this.sessionService.getSessionById(
          targetSessionId,
          dbClient
        );

        if (!targetSession) {
          throw this.errorFactory.createNotFoundError("Sesión no encontrada", {
            sessionId: targetSessionId,
            operation: "closeSpecificUserSession",
          });
        }

        if (targetSession.userId !== currentUserId) {
          throw this.errorFactory.createForbiddenError(
            "No tienes permisos para cerrar esta sesión",
            {
              attemptingUserId: currentUserId,
              sessionUserId: targetSession.userId,
              sessionId: targetSessionId,
              operation: "closeSpecificUserSession",
            }
          );
        }

        // Verify that the session belongs to the same user
        const currentRefreshTokenHash =
          this.jwtAuth.createHashRefreshToken(refreshToken);
        if (targetSession.refreshTokenHash === currentRefreshTokenHash) {
          throw this.errorFactory.createConflictError(
            "No puedes cerrar tu sesión actual con este método. Usa logOutUserSession.",
            {
              sessionId: targetSessionId,
              userId: currentUserId,
              operation: "closeSpecificUserSession",
            }
          );
        }

        const result = await this.sessionService.deactivateSpecificSession(
          targetSessionId,
          currentUserId,
          dbClient
        );

        if (!result.success) {
          throw this.errorFactory.createNotFoundError(
            "No se pudo cerrar la sesión especificada",
            {
              sessionId: targetSessionId,
              userId: currentUserId,
              operation: "closeSpecificUserSession",
            }
          );
        }

        return {
          sessionId: targetSessionId,
          userId: currentUserId,
        };
      }, externalDbClient);
    });
  }

  async getUserActiveSessions(
    accessToken,
    options = {},
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["accessToken"], { accessToken });
      let decoded;
      try {
        decoded = this.jwtAuth.verifyAccessToken(accessToken);
      } catch (error) {
        throw this.errorFactory.createAuthenticationError(
          "Access Token inválido",
          {
            operation: "getUserActiveSessions",
            tokenType: "access",
          }
        );
      }
      const currentUserId = decoded.sub;
      const currentSessionId = decoded.sessionId;

      return this.dbManager.forRead(async (dbClient) => {
        await this.userService.validateUserExistenceById(
          currentUserId,
          dbClient
        );

        const response = await this.sessionService.getAllUserActiveSessions(
          currentUserId,
          currentSessionId,
          options,
          externalDbClient
        );

        return response;
      }, externalDbClient);
    });
  }
}

module.exports = AuthService;
