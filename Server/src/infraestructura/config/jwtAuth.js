const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TokenExpiredError } = jwt;

class JwtAuth {

  generarAccessToken(idUsuario, rol = 'usuario') {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET no configurado');
    }

    return jwt.sign(
      { idUsuario: idUsuario, rol },
      process.env.JWT_ACCESS_SECRET,
     { expiresIn: process.env.EXP_ACCESS_TOKEN }
    );
  }

  // Genera Refresh Token + Hash
  generarRefreshToken(idUsuario) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET no configurado');
    }

    // Generar JWT
    const refreshToken = jwt.sign(
      { idUsuario: idUsuario },
      process.env.JWT_REFRESH_SECRET,
     { expiresIn: process.env.EXP_REFRESH_TOKEN}
    );

    // Generar hash SHA256 para guardar en DB
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Devolver ambos, token para cliente y hash para BD
    return { refreshToken, refreshTokenHash };
  }

  // Verificar Access Token
  verificarAccessToken(token) {
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
  verificarRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new Error('Refresh token expirado');
      }
      throw new Error('Refresh token inválido');
    }
  }

  // Decodificar token sin verificar
  decodificarToken(token) {
    return jwt.decode(token);
  }

  // Generar hash de un token
  generarHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = JwtAuth;
