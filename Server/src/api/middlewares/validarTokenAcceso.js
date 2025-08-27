const jwt = require('jsonwebtoken');

const validarTokenAcceso = (req, res, next) => {
  try {
    console.log('Todas las cookies recibidas:', req.cookies);
    console.log('Headers cookie:', req.headers.cookie);
    // Verificar que req.cookies existe
    if (!req.cookies) {
      console.log("NO COOCKIE");
      return res.status(401).json({ 
        status: "error",
        message: 'Cookies no disponibles' 
      });
    }

    // Obtener token de la cookie
    const token = req.cookies.accessToken;
    
    if (!token) {
      console.log("NO TOKEN");
      return res.status(401).json({ 
        status: "error",
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log("USUARIO DECODIFICADO:", decoded);
    
    // Agregar info del usuario al request
    req.usuario = {
      id: decoded.id,
      rol: decoded.rol
    };

    // Continuar al controller
    next();
  } catch (error) {
    console.error("Error validando token:", error);
    
    // Limpiar cookie inválida
    res.clearCookie('accessToken');
    
    return res.status(401).json({ 
      status: "error",
      message: 'Token inválido o expirado' 
    });
  }
};

module.exports = { validarTokenAcceso };