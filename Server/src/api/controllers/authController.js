const { COOKIE_OPTIONS } = require("../config/cookiesConfig");

const { clearAuthCookies } = require("../utils/cookieUtils");
class AuthController {
  constructor({ authService, userMapper, sessionMapper, errorFactory }) {
    this.authService = authService;
    this.userMapper = userMapper;
    this.sessionMapper = sessionMapper;
    this.errorFactory = errorFactory;
  }

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
      if (result.isNewRefreshToken) {
        res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
        console.log("Nuevo refresh token establecido en cookies");
      } else {
        console.log("Usando refresh token existente");
      }

      const authResponse = this.userMapper.domainToAuthResponse(result);

      return res.status(200).json({
        success: true,
        message: "Success auth",
        data: authResponse,
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logOut(req, res, next) {
    try {
      const refreshTokenExistente = req.cookies.refreshToken;

      if (!refreshTokenExistente) {
        return res.status(401).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      const result = await this.authService.logOutUserSession(
        refreshTokenExistente
      );

      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: result.message,
        userId: result.userId,
      });
    } catch (error) {
      clearAuthCookies(res);

      next(error);
    }
  }

  async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      const result = await this.authService.refreshAccessToken(refreshToken);
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

  async closeAllUserSessions(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await this.authService.deactivateAllUserSessions(userId);

      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: result.deactivated
          ? "Todas las sesiones han sido desactivadas correctamente"
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

  async getUserActiveSessions(req, res, next) {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

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
