const jwt = require('jsonwebtoken');
const { TokenExpiredError } = jwt;

class JwtAuth {
  static generarTokenAcceso(userId, rol = 'usuario') {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET no configurado');
    }
    return jwt.sign(
      { id: userId, rol },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }

  static generarRefreshToken(userId) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET no configurado');
    }
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verificarTokenAcceso(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new Error('Token expirado');
      }
      throw new Error('Token inválido');
    }
  }

  static verificarTokenRefresco(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new Error('Token de refresco inválido');
    }
  }

  static decodificarToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtAuth;