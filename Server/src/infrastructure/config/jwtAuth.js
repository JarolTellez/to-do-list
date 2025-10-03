const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TokenExpiredError } = jwt;

class JwtAuth {
 constructor(appConfig) {
    this.appConfig = appConfig;
  }

  createAccessToken({userId, email,rol = 'user', sessionId}) {
    if (!this.appConfig.jwt.access.secret) {
      throw new Error('JWT_ACCESS_SECRET no configurado');
    }

    return jwt.sign(
      { sub: userId,email, rol, sessionId},
      this.appConfig.jwt.access.secret,
     { expiresIn: this.appConfig.jwt.access.expiresIn}
    );
  }

   
  createRefreshToken(userId) {
    if (!this.appConfig.jwt.refresh.secret) {
      throw new Error('JWT_REFRESH_SECRET no configurado');
    }
    const refreshToken = jwt.sign(
      { sub: userId,
       },
      this.appConfig.jwt.refresh.secret,
     { expiresIn:this.appConfig.jwt.refresh.expiresIn}
    );

    return refreshToken;
  }

  createHashRefreshToken(refreshToken){
    const hash= crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");

    return hash;
        
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.appConfig.jwt.access.secret);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new Error('Token de acceso expirado');
      }
      throw new Error('Token de acceso inválido');
    }
  }


verifyRefreshToken(token) {
    try {
        return jwt.verify(token, this.appConfig.jwt.refresh.secret);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expirado');
        }
        throw new Error('Refresh token inválido');
    }
}


  decodeToken(token) {
    return jwt.decode(token);
  }


  createHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = JwtAuth;
