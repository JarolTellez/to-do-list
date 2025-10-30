const jwt = require('jsonwebtoken');

const validateRefreshToken = (req, res, next) => {
  try {
 
    if (!req.cookies) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Cookies no disponibles' 
      });
    }

    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Refresh token requerido' 
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    req.user = {
      userId: decoded.userId
    };
    req.refreshToken = refreshToken; 

    next();
  } catch (error) {
    console.error('Error validando refresh token:', error);

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