const jwt = require("jsonwebtoken");

const validateAccessToken = async (req, res, next) => {
  try {
    const jwtAuth = req.app.get("jwtAuth");
    const sessionService = req.app.get("sessionService");

    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso no puede estar vacío",
        code: "EMPTY_TOKEN",
      });
    }

    const decoded = jwtAuth.verifyAccessToken(accessToken);

    const isSessionActive = await sessionService.validateSessionById(
      decoded.sub,
      decoded.sessionId
    );

    if (!isSessionActive) {
      return res.status(401).json({
        status: "error",
        message: "Sesión expirada o cerrada",
        code: "SESSION_EXPIRED",
      });
    }

    req.user = {
      userId: decoded.sub,
      rol: decoded.rol,
      sessionId: decoded.sessionId,
      email: decoded.email,
    };

    // continuar al controller
    next();
  } catch (error) {
    console.error("Error validando token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token de acceso expirado",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token de acceso inválido",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(401).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
};

module.exports = { validateAccessToken };
