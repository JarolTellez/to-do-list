const jwt = require('jsonwebtoken');

const validateRefreshToken = (req, res, next) => {
  try {
    // Verificar que req.cookies existe
    if (!req.cookies) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Cookies no disponibles' 
      });
    }

    // Obtener refresh guardado en la cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Refresh token requerido' 
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Agregar info al request
    req.user = {
      userId: decoded.userId
    };
    req.refreshToken = refreshToken; 

    next();
  } catch (error) {
    console.error('Error validando refresh token:', error);
    
   // Limpiar la cookie 
    res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });
    
    return res.status(401).json({ 
      status: 'error',
      message: 'Refresh token inválido o expirado' 
    });
  }
};

module.exports = {validateRefreshToken };