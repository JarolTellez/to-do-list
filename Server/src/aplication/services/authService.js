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

      let refreshTokenToUse = null;
      let session = null;
      let isNewRefreshToken = true;

      if (existingRefreshToken) {
        try {
          // Verify jwt
          const decoded = this.jwtAuth.verifyRefreshToken(existingRefreshToken);
          const refreshTokenHash =
            this.jwtAuth.createHashRefreshToken(existingRefreshToken);

          // Verify userId in refreshToken is the same as consulted with validate credentiasl
          if (decoded.userId === user.id) {
            // verify refreshtoken session exists and is active
            const isValidSession = await this.sessionService.validateSession(
              decoded.userId,
              refreshTokenHash,
              connection
            );

            if (isValidSession) {
              refreshTokenToUse = existingRefreshToken;
              session = isValidSession;
              isNewRefreshToken = false;
            }
          } else {
            await this.sessionService.deactivateSession(
              decoded.userId,
              refreshTokenHash,
              connection
            );
          }
        } catch (error) {
          const refreshTokenHash =
            this.jwtAuth.createHashRefreshToken(existingRefreshToken);
          await this.sessionService.deactivateSessionByTokenHash(
            refreshTokenHash,
            connection
          );
          // if token is no valid o expired ignores it and creates a new one
          console.log(
            "Refresh token existente inválido, creando nuevo:",
            error.message
          );
        }
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
          "Refresh Token inválido"
        );
      }

      const refreshTokenHashRecibido =
        this.jwtAuth.createHashRefreshToken(refreshToken);

      const deactivatedSession = await this.sessionService.deactivateSession(
        decoded.userId,
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
        usuarioId: decoded.userId,
      };
    }, externalConn);
  }

  async refreshAccessToken(refreshToken, externalConn = null) {
    this.validator.validateRequired(["refreshToken"], { refreshToken });

    return this.withTransaction(async (connection) => {
      const sessionValidation = await this.sessionService.validateActiveSession(
        refreshToken,
        connection
      );

      if (!sessionValidation.isValid) {
        throw this.errorFactory.createAuthenticationError(
          sessionValidation.error || "Sesión inválida"
        );
      }
      const user = await this.userService.validateUserExistenceById(
        sessionValidation.session.userId,
        connection
      );

      const accessToken = this.jwtAuth.createAccessToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
      });

      const userResponse = this.userMapper.domainToResponse(user);

      return {
        user: userResponse,
        accessToken: accessToken,
        expiresIn: this.appConfig.jwt.access.expiresIn,
        tokenType: "Bearer",
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
