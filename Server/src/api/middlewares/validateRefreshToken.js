const { clearAuthCookies } = require("../utils/cookieUtils");

const validateRefreshToken = async (req, res, next) => {
  try {
    const jwtAuth = req.app.get("jwtAuth");
    const sessionService = req.app.get("sessionService");
    const errorFactory = req.app.get("errorFactory");

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      clearAuthCookies(res);
      return next(
        errorFactory.createAuthenticationError(
          "No hay sesión activa",
          {
            operation: "validateRefreshToken",
          },
          errorFactory.ErrorCodes.NO_ACTIVE_SESSION
        )
      );
    }

    let decoded;
    try {
      decoded = jwtAuth.verifyRefreshToken(refreshToken);
    } catch (error) {
      const refreshTokenHash = jwtAuth.createHashRefreshToken(refreshToken);
      await sessionService.deactivateSessionByTokenHash(refreshTokenHash);

      clearAuthCookies(res);

      if (error.name === "TokenExpiredError") {
        return next(
          errorFactory.createAuthenticationError(
            "Refresh token expirado",
            {
              operation: "validateRefreshToken",
              tokenType: "refresh",
              expired: true,
            },
            errorFactory.ErrorCodes.REFRESH_TOKEN_EXPIRED
          )
        );
      } else {
        return next(
          errorFactory.createAuthenticationError(
            "Refresh token inválido",
            {
              operation: "validateRefreshToken",
              tokenType: "refresh",
              invalid: true,
            },
            errorFactory.ErrorCodes.INVALID_REFRESH_TOKEN
          )
        );
      }
    }

    const refreshTokenHash = jwtAuth.createHashRefreshToken(refreshToken);
    const sessionValidation = await sessionService.validateSession(
      decoded.sub,
      refreshTokenHash
    );

    if (!sessionValidation) {
      clearAuthCookies(res);
      return next(
        errorFactory.createAuthenticationError(
          "Sesión no encontrada o inactiva",
          {
            operation: "validateRefreshToken",
          },
          errorFactory.ErrorCodes.INVALID_SESSION
        )
      );
    }

    req.user = {
      userId: decoded.sub,
      sessionId: sessionValidation.id,
    };

    next();
  } catch (error) {
    console.error("Error validando refresh token:", error);
    clearAuthCookies(res);
    next(error);
  }
};

module.exports = { validateRefreshToken };
