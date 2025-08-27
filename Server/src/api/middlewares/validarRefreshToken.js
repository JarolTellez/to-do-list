const jwt = require('jsonwebtoken');

const validarRefreshToken = (req, res, next) => {
  try {
    // Verificar que req.cookies existe
    if (!req.cookies) {
      return res.status(401).json({ 
        status: "error",
        message: 'Cookies no disponibles' 
      });
    }

    // Obtener refresh token de la cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        status: "error",
        message: 'Refresh token requerido' 
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Agregar info al request
    req.usuario = {
      id: decoded.id
    };
    req.refreshToken = refreshToken; // Para usarlo en el controller

    next();
  } catch (error) {
    console.error("Error validando refresh token:", error);
    
    // Limpiar cookies en caso de error
    res.clearCookie('refreshToken', { 
      path: '/auth/renovar-token' // Mismo path que se configuró
    });
    
    return res.status(401).json({ 
      status: "error",
      message: 'Refresh token inválido o expirado' 
    });
  }
};

module.exports = { validarTokenAcceso, validarRefreshToken };