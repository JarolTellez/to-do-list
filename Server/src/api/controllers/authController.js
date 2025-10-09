const {
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} = require("../config/cookiesConfig");
class AuthController {
  constructor({ authService, userMapper, sessionMapper, errorFactory }) {
    this.authService = authService;
    this.userMapper = userMapper;
    this.sessionMapper = sessionMapper;
    this.errorFactory = errorFactory;
  }

  async login(req, res, next) {
    try {
      const loginRequestDTO = this.userMapper.requestDataToLoginDTO(req.body);
      const userAgent = req.get("User-Agent");
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

      return res.status(200).json({
        success: true,
        message: "Success auth",
        data: result.authResponse,
      });
    } catch (error) {
      this._clearAuthCookies(res);
      next(error);
    }
  }

  async logOut(req, res, next) {
    try {
      const refreshTokenExistente = req.cookies.refreshToken;

      if (!refreshTokenExistente) {
        return res.status(400).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      const result = await this.authService.logOutUserSession(
        refreshTokenExistente
      );

      this._clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: result.message,
        userId: result.userId,
      });
    } catch (error) {
      this._clearAuthCookies(res);

      next(error);
    }
  }

  async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw this.errorFactory.createAuthenticationError(
          "Refresh token no proporcionado"
        );
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: "Access token renovado exitosamente",
        data: result,
      });
    } catch (error) {
      this._clearAuthCookies(res);
      next(error);
    }
  }

  async closeAllUserSessions(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await this.authService.deactivateAllUserSessions(userId);

      this._clearAuthCookies(res);

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
      this._clearAuthCookies(res);
      next(error);
    }
  }

  async getUserActiveSessions(req, res, next) {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      const { page, limit } = req.query;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      const result = await this.authService.getUserActiveSessions(accessToken, {
        page,
        limit,
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
      this._clearAuthCookies(res);
      next(error);
    }
  }

  _clearAuthCookies(res) {
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
  }
}

module.exports = AuthController;
