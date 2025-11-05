const {
  REFRESH_TOKEN_OPTIONS,
  ACCESS_TOKEN_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} = require("../config/cookiesConfig");

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
        tokenRefreshed: false
      });
    }

    const result = await this.authService.verifyUserSession({
      accessToken,
      refreshToken,
    });

    if (result.isAuthenticated) {
      const mappedUser = this.userMapper.domainToResponse(result.user);
      if (result.newAccessToken) {
        res.cookie("accessToken", result.newAccessToken, ACCESS_TOKEN_OPTIONS);
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
        tokenRefreshed: false
      });
    }
  } catch (error) {
    console.error("Error en verifySession:", error);
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Error verificando sesión",
      isAuthenticated: false,
      data: null,
      tokenRefreshed: false
    });
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
