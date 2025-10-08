const jwt = require("jsonwebtoken");

const validateAccessToken = async (req, res, next) => {
  try {
    const jwtAuth = req.app.get("jwtAuth");
    const sessionService = req.app.get("sessionService");
    const authorizationHeader = req.headers["authorization"];

    // Verificar que exista el header y tenga el formato correcto
    if (!authorizationHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header requerido",
        code: "MISSING_AUTH_HEADER",
      });
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Formato de autorización inválido. Use: Bearer <token>",
        code: "INVALID_AUTH_FORMAT",
      });
    }

    const accessToken = authorizationHeader.split(" ")[1];

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

    return res.status(401).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
};

module.exports = { validateAccessToken };
