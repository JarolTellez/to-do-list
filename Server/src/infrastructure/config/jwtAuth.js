const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { TokenExpiredError } = jwt;

class JwtAuth {
  constructor(appConfig, errorFactory) {
    this.appConfig = appConfig;
    this.errorFactory = errorFactory;
  }

  createAccessToken({ userId, email, rol = "user", sessionId }) {
    if (!this.appConfig.jwt.access.secret) {
      throw this.errorFactory.createAuthenticationError(
        "JWT_ACCESS_SECRET no configurado",
        {
          operation: "createAccessToken",
          configIssue: true,
        },
        this.errorFactory.ErrorCodes.INVALID_TOKEN
      );
    }

    return jwt.sign(
      { sub: userId, email, rol, sessionId },
      this.appConfig.jwt.access.secret,
      { expiresIn: this.appConfig.jwt.access.expiresIn }
    );
  }

  createRefreshToken(userId) {
    if (!this.appConfig.jwt.refresh.secret) {
      throw this.errorFactory.createAuthenticationError(
        "JWT_REFRESH_SECRET no configurado",
        {
          operation: "createRefreshToken",
          configIssue: true,
        },
        this.errorFactory.ErrorCodes.INVALID_TOKEN
      );
    }
    const refreshToken = jwt.sign(
      { sub: userId },
      this.appConfig.jwt.refresh.secret,
      { expiresIn: this.appConfig.jwt.refresh.expiresIn }
    );

    return refreshToken;
  }

  createHashRefreshToken(refreshToken) {
    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    return hash;
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.appConfig.jwt.access.secret);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw this.errorFactory.createAuthenticationError(
          "Token de acceso expirado",
          {
            operation: "verifyAccessToken",
            tokenType: "access",
            expired: true,
          },
          this.errorFactory.ErrorCodes.TOKEN_EXPIRED
        );
      }
      throw this.errorFactory.createAuthenticationError(
        "Token de acceso inválido",
        {
          operation: "verifyAccessToken",
          tokenType: "access",
          invalid: true,
        },
        this.errorFactory.ErrorCodes.INVALID_TOKEN
      );
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.appConfig.jwt.refresh.secret);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          throw this.errorFactory.createAuthenticationError(
            "Refresh token expirado",
            {
              operation: "verifyRefreshToken",
              tokenType: "refresh",
              expired: true,
            },
            this.errorFactory.ErrorCodes.TOKEN_EXPIRED
          );
        }
      throw this.errorFactory.createAuthenticationError(
        "Refresh token inválido",
        {
          operation: "verifyRefreshToken",
          tokenType: "refresh",
          invalid: true,
        },
        this.errorFactory.ErrorCodes.INVALID_TOKEN
      );
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }

  createHash(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

module.exports = JwtAuth;
