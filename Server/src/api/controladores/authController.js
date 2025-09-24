class AuthController {
  constructor({ authService, userMapper, errorFactory }) {
    this.authService = authService;
    this.userMapper = userMapper;
    this.errorFactory = errorFactory;
  }

  async login(req, res, next) {
    try {
      const loginRequestDTO = this.userMapper.requestDataToLoginDTO(req.body);
      

      const deviceInfo = JSON.parse(req.get("Device-info") || "{}");
      const ip = req.ip;
      const existingRefreshToken = req.cookies.refreshToken;

      const result = await this.authService.loginUser({
        existingRefreshToken,
        loginRequestDTO,
        deviceInfo,
        ip
    });

      // Solo se establece cookie si se genero un nuevo refresh token
      if (result.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        console.log("Nuevo refresh token establecido en cookies");
      } else {
        console.log("Usando refresh token existente");
      }

      return res.status(200).json({
        success: true,
        message: "Success auth",
        data: result,
      });
    } catch (error) {
      // Limpiar cookies en caso de error
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
      next(error);
    }
  }

  async logOut(req, res, next) {
    try {
      const refreshTokenExistente = req.cookies.refreshToken;

      if (!refreshTokenExistente) {
        throw this.errorFactory.createAuthenticationError(
          "No hay token de refresh presente"
        );
      }

      const result = await this.authService.logOutSession(
        refreshTokenExistente
      );

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });

      return res.status(200).json({
        status: "success",
        message: "Logout exitoso",
        data: result,
      });
    } catch (error) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });

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
      res.clearCookie("refreshToken");
      next(error);
    }
  }

  async refreshRefreshToken(req, res, next) {}
}

module.exports = AuthController;
