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
  }) {
    super(connectionDB);
    this.user = user;
    this.userService = userService;
    this.userMapper=userMapper;
    this.sessionService = sessionService;
    this.userDAO = userDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
    this.errorFactory = errorFactory;
    this.validator = validator;
  }

  
  async loginUser({
    existingRefreshToken,
    loginRequestDTO,
    userAgent,
    ip},
    externalConn = null,
  ) {
    this.validator.validateRequired(
      ["loginRequestDTO"],
      {
        loginRequestDTO,
      }
    );
    return this.withTransaction(async (connection) => {
      const user = await this.validateCredentials(loginRequestDTO, connection);
      const sessionResult = await this.sessionService.manageUserSession(
        {
          userId: user.id,
          existingRefreshToken,
          userAgent,
          ip,
        },
        connection
      );

      const accessToken = this.jwtAuth.createAccessToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
      });

      const userResponse = this.userMapper.domainToResponse(user);
      const authResponse = this.userMapper.domainToAuthResponse(
        user,
        accessToken,
        process.env.JWT_ACCESS_EXPIRE_IN || "15m"
      );

      return {
        ...authResponse,
        refreshToken: sessionResult.refreshToken,
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
      const user = await this.userDAO.findById(
        sessionValidation.session.userId,
        connection
      );
      if (!user) {
        throw this.errorFactory.createNotFoundError("Usuario no encontrado");
      }

      const accessToken = this.jwtAuth.createAccessToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
      });

      const userResponse = this.userMapper.domainToResponse(user);

      return {
        user: userResponse,
        accessToken: accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRE_IN || "15m",
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

  async validateCredentials(loginRequestDTO, externalConn = null) {

    this.validator.validateRequired(["email", "password"], loginRequestDTO);
    this.validator.validateEmail("email", loginRequestDTO);

    const user = await this.userDAO.findByEmail(
      loginRequestDTO.email,
      externalConn
    );
    if (!user) {
      throw this.errorFactory.createAuthenticationError(
        "Credenciales inválidas"
      );
    }

    const isPasswordValid = await this.bcrypt.compare(
      loginRequestDTO.password,
      user.password
    );
    if (!isPasswordValid) {
      throw this.errorFactory.createAuthenticationError(
        "Credenciales inválidas"
      );
    }

    return user;
  }
}

module.exports = AuthService;
