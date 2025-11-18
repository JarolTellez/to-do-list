const { clearAuthCookies } = require("../utils/cookieUtils");
/**
 * Authentication middleware for validating access tokens in API requests
 * @middleware validateAccessToken
 * @description Validates access token from cookies and attaches user information to request
 */
const validateAccessToken = async (req, res, next) => {
  const jwtAuth = req.app.get("jwtAuth");
  const sessionService = req.app.get("sessionService");
  const errorFactory = req.app.get("errorFactory");

  try {
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
      clearAuthCookies(res);
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

    if (
      !(
        error.errorCode === errorFactory.ErrorCodes.ACCESS_TOKEN_EXPIRED ||
        error.errorCode === errorFactory.ErrorCodes.INVALID_ACCESS_TOKEN
      )
    ) {
      clearAuthCookies(res);
    }

    next(error);
  }
};

module.exports = { validateAccessToken };
