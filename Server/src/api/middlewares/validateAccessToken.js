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
        error: "Authorization header requerido",
        code: "MISSING_AUTH_HEADER",
      });
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Formato de autorización inválido. Use: Bearer <token>",
        code: "INVALID_AUTH_FORMAT",
      });
    }
    //  Extraer solo el token eliminando el 'Barear'
    const accessToken = authorizationHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Token de acceso no puede estar vacío",
        code: "EMPTY_TOKEN",
      });
    }

    // Verificar token
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

    // Continuar al controller
    next();
  } catch (error) {
    console.error("Error validando token:", error);

    return res.status(401).json({
      success: false,
      error: errorMessage,
      code: errorCode,
    });
  }
};

module.exports = { validateAccessToken };
