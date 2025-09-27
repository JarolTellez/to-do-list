const jwt = require("jsonwebtoken");

const validateAccessToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];

    // Verificar que exista el header y tenga el formato correcto
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requerido" });
    }

    //  Extraer solo el token eliminando el 'Barear'
    const accessToken = authorizationHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        status: "error",
        message: "Token de acceso requerido",
      });
    }

    // Verificar token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    const sessionService = req.app.get("sessionService");

    const isSessionActive = await sessionService.validateSessionById(
      decoded.userId,
      decoded.sessionId
    );

    if (!isSessionActive) {
      return res.status(401).json({
        status: "error",
        message: "Sesión expirada o cerrada",
      });
    }

    req.usuario = {
      userId: decoded.userId,
      rol: decoded.rol,
    };

    // Continuar al controller
    next();
  } catch (error) {
    console.error("Error validando token:", error);

    return res.status(401).json({
      status: "error",
      message: "Token inválido o expirado",
    });
  }
};

module.exports = { validateAccessToken };
