const {
  REFRESH_TOKEN_OPTIONS,
  ACCESS_TOKEN_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} = require("../config/cookiesConfig");

const { clearAuthCookies } = require("../utils/cookieUtils");

/**
 * Authentication controller for handling auth-related API endpoints
 * @class AuthController
 * @description Handles user authentication, session management, and token operations
 */
class AuthController {
  /**
   * Creates a new AuthController instance
   * @constructor
   * @param {Object} dependencies - Controller dependencies
   * @param {AuthService} dependencies.authService - Authentication service instance
   * @param {Object} dependencies.userMapper - User mapper for data transformation
   * @param {Object} dependencies.sessionMapper - Session mapper for data transformation
   * @param {ErrorFactory} dependencies.errorFactory - Error factory instance
   */
  constructor({ authService, userMapper, sessionMapper, errorFactory }) {
    this.authService = authService;
    this.userMapper = userMapper;
    this.sessionMapper = sessionMapper;
    this.errorFactory = errorFactory;
  }

  /**
   * Handles user login authentication
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with authentication result
   */
  async login(req, res, next) {
    try {
      const userAgent = req.headers["user-agent"];
      const loginRequestDTO = this.userMapper.requestDataToLoginDTO(req.body);
      const ip = req.ip;
      const existingRefreshToken = req.cookies.refreshToken;

      const result = await this.authService.loginUser({
        existingRefreshToken,
        loginRequestDTO,
        userAgent,
        ip,
      });
      res.cookie("refreshToken", result.refreshToken, REFRESH_TOKEN_OPTIONS);
      res.cookie("accessToken", result.accessToken, ACCESS_TOKEN_OPTIONS);
      const userResponse = this.userMapper.domainToResponse(result.userDomain);

      return res.status(200).json({
        success: true,
        message: "Autenticación exitosa",
        data: userResponse,
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * Handles user logout and session termination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with logout result
   */
  async logOut(req, res, next) {
    try {
      const refreshTokenExistente = req.cookies.refreshToken;

      if (!refreshTokenExistente) {
        return res.status(200).json({
          success: true,
          message: "No hay sesión activa para cerrar",
        });
      }

      await this.authService.logOutUserSession(refreshTokenExistente);

      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente",
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * Handles access token refresh
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with new access token
   */
  async refreshAccessToken(req, res, next) {
    try {
      const { userId, sessionId } = req.user;

      const result = await this.authService.refreshAccessToken(
        userId,
        sessionId
      );

      res.cookie("accessToken", result.accessToken, ACCESS_TOKEN_OPTIONS);
      result.user = this.userMapper.domainToResponse(result.user);

      return res.status(200).json({
        success: true,
        message: "Access token renovado exitosamente",
        data: result,
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * Verifies current user session validity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with session verification result
   */
  async verifySession(req, res, next) {
    try {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(200).json({
          success: true,
          message: "No hay sesión activa",
          isAuthenticated: false,
          data: null,
          tokenRefreshed: false,
        });
      }

      const result = await this.authService.verifyUserSession({
        accessToken,
        refreshToken,
      });

      if (result.isAuthenticated) {
        const mappedUser = this.userMapper.domainToResponse(result.user);
        if (result.newAccessToken) {
          res.cookie(
            "accessToken",
            result.newAccessToken,
            ACCESS_TOKEN_OPTIONS
          );
        }

        return res.status(200).json({
          success: true,
          message: "Sesión activa",
          isAuthenticated: true,
          data: mappedUser,
          tokenRefreshed: !!result.newAccessToken,
        });
      } else {
        clearAuthCookies(res);
        return res.status(200).json({
          success: true,
          message: "Sesión no válida o expirada",
          isAuthenticated: false,
          data: null,
          tokenRefreshed: false,
        });
      }
    } catch (error) {
      console.error("Error en verifySession:", error);
      if (
        error.code === "AUTHENTICATION_ERROR" ||
        error.code === "SESSION_EXPIRED" ||
        error.code === "INVALID_TOKEN"
      ) {
        clearAuthCookies(res);
      }
      return res.status(200).json({
        success: true,
        message: "Error verificando sesión",
        isAuthenticated: false,
        data: null,
        tokenRefreshed: false,
      });
    }
  }

  /**
   * Closes all active sessions for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with session closure result
   */
  async closeAllUserSessions(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await this.authService.deactivateAllUserSessions(userId);

      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: result.deactivated
          ? "Todas las sesiones han sido desactivadas"
          : "No se encontraron sesiones activas para desactivar",
        data: {
          deactivatedSessions: result.deactivated,
          userId: result.userId,
        },
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * Retrieves all active sessions for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with paginated session list
   */
  async getUserActiveSessions(req, res, next) {
    try {
      const accessToken = req.cookies.accessToken;
      const { page, limit, sortBy, sortOrder } = req.query;

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      const result = await this.authService.getUserActiveSessions(accessToken, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sortBy,
        sortOrder,
      });

      const mappedSessions = result.sessions.map((session) =>
        this.sessionMapper.domainToResponse(session, req.user.sessionId)
      );

      const message =
        mappedSessions.length === 0
          ? "No hay sesiones activas"
          : "Sesiones activas consultadas exitosamente";

      return res.status(200).json({
        success: true,
        message: message,
        data: {
          sessions: mappedSessions,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }
}

module.exports = AuthController;
