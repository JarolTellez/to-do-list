// const jwt = require('jsonwebtoken');
// const { TokenExpiredError } = jwt;

// class JwtAuth {
//   generarTokenAcceso(userId, rol = 'usuario') {
//     if (!process.env.JWT_ACCESS_SECRET) {
//       throw new Error('JWT_ACCESS_SECRET no configurado');
//     }
//     return jwt.sign(
//       { id: userId, rol },
//       process.env.JWT_ACCESS_SECRET,
//       { expiresIn: '15m' }
//     );
//   }

//    generarRefreshToken(userId) {
//     if (!process.env.JWT_REFRESH_SECRET) {
//       throw new Error('JWT_REFRESH_SECRET no configurado');
//     }
//     return jwt.sign(
//       { id: userId },
//       process.env.JWT_REFRESH_SECRET,
//       { expiresIn: '7d' }
//     );
//   }

//    verificarTokenAcceso(token) {
//     try {
//       return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//     } catch (err) {
//       if (err instanceof TokenExpiredError) {
//         throw new Error('Token expirado');
//       }
//       throw new Error('Token inválido');
//     }
//   }

//   verificarTokenRefresco(token) {
//     try {
//       return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
//     } catch (err) {
//       throw new Error('Token de refresco inválido');
//     }
//   }

//    decodificarToken(token) {
//     return jwt.decode(token);
//   }
// }

// module.exports = JwtAuth;

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TokenExpiredError } = jwt;

class JwtAuth {
  // Genera Access Token normal (15 min)
  generarTokenAcceso(userId, rol = 'usuario') {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET no configurado');
    }

    return jwt.sign(
      { id: userId, rol },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }

  // Genera Refresh Token + Hash
  generarRefreshToken(userId) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET no configurado');
    }

    // Generar JWT
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Generar hash SHA256 para guardar en DB
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Devolver ambos: token para cliente y hash para BD
    return { refreshToken, hash };
  }

  // Verificar Access Token
  verificarTokenAcceso(token) {
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
  verificarTokenRefresco(token) {
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

  // Generar hash de un token (útil al recibir refresh token del cliente)
  generarHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = JwtAuth;
