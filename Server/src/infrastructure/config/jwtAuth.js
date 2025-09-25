const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TokenExpiredError } = jwt;

class JwtAuth {

  createAccessToken(userId, rol = 'user') {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET no configurado');
    }

    return jwt.sign(
      { userId: userId, rol },
      process.env.JWT_ACCESS_SECRET,
     { expiresIn: process.env.EXP_ACCESS_TOKEN }
    );
  }

  // Genera Refresh Token 
  createRefreshToken(userId) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET no configurado');
    }

    // Generar JWT
    const refreshToken = jwt.sign(
      { userId: userId
       },
      process.env.JWT_REFRESH_SECRET,
     { expiresIn: process.env.EXP_REFRESH_TOKEN}
    );

    // Devolver ambos, token para cliente y hash para BD
    return refreshToken;
  }

  // Verificar Access Token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new Error('Token de acceso expirado');
      }
      throw new Error('Token de acceso inválido');
    }
  }

  // Verificar Refresh Token (firma y expiración)
verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expirado');
        }
        throw new Error('Refresh token inválido');
    }
}

  // Decodificar token sin verificar
  decodeToken(token) {
    return jwt.decode(token);
  }

  // Generar hash de un token
  createHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = JwtAuth;
