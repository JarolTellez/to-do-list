const validateAccessToken = async (req, res, next) => {
  try {
    const jwtAuth = req.app.get("jwtAuth");
    const sessionService = req.app.get("sessionService");
    const errorFactory = req.app.get("errorFactory");

    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return next(
        errorFactory.createAuthenticationError(
          "Token de acceso no puede estar vacío",
          { code: "EMPTY_TOKEN" }
        )
      );
    }

    const decoded = jwtAuth.verifyAccessToken(accessToken);

    const isSessionActive = await sessionService.validateSessionById(
      decoded.sub,
      decoded.sessionId
    );

    if (!isSessionActive) {
      return next(
        errorFactory.createAuthenticationError(
          "Sesión expirada o cerrada",
          {
            operation: "validateAccessToken",
          },
          errorFactory.ErrorCodes.SESSION_EXPIRED
        )
      );
    }

    req.user = {
      userId: decoded.sub,
      rol: decoded.rol,
      sessionId: decoded.sessionId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Error validando token:", error);
    if (error.name === "TokenExpiredError") {
      return next(
        errorFactory.createAuthenticationError(
          "Token de acceso expirado",
          {
            operation: "validateAccessToken",
            expired: true,
          },
          errorFactory.ErrorCodes.ACCESS_TOKEN_EXPIRED
        )
      );
    }

    if (error.name === "JsonWebTokenError") {
      return next(
        errorFactory.createAuthenticationError(
          "Token de acceso inválido",
          {
            operation: "validateAccessToken",
          },
          errorFactory.ErrorCodes.INVALID_ACCESS_TOKEN
        )
      );
    }

    next(error);
  }
};

module.exports = { validateAccessToken };
