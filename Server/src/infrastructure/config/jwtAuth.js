const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { TokenExpiredError } = jwt;

/**
 * JWT authentication utility for token creation, verification and management
 * @class JwtAuth
 */
class JwtAuth {
  /**
   * Creates a new JwtAuth instance
   * @param {Object} appConfig - Application configuration
   * @param {Object} appConfig.jwt - JWT configuration
   * @param {Object} appConfig.jwt.access - Access token configuration
   * @param {string} appConfig.jwt.access.secret - Access token secret key
   * @param {string} appConfig.jwt.access.expiresIn - Access token expiration time
   * @param {Object} appConfig.jwt.refresh - Refresh token configuration
   * @param {string} appConfig.jwt.refresh.secret - Refresh token secret key
   * @param {string} appConfig.jwt.refresh.expiresIn - Refresh token expiration time
   * @param {ErrorFactory} errorFactory - Error factory for creating authentication errors
   */
  constructor(appConfig, errorFactory) {
    this.appConfig = appConfig;
    this.errorFactory = errorFactory;
  }

  /**
   * Creates a new access token for user authentication
   * @param {Object} payload - Token payload data
   * @param {number} payload.userId - User ID (subject)
   * @param {string} payload.email - User email
   * @param {string} [payload.rol="user"] - User role
   * @param {number} payload.sessionId - Session ID
   * @returns {string} Signed JWT access token
   * @throws {AuthenticationError} When JWT_ACCESS_SECRET is not configured
   */
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

  /**
   * Creates a new refresh token for session persistence
   * @param {number} userId - User ID (subject)
   * @returns {string} Signed JWT refresh token
   * @throws {AuthenticationError} When JWT_REFRESH_SECRET is not configured
   */
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

  /**
   * Creates SHA-256 hash of refresh token for secure storage
   * @param {string} refreshToken - Refresh token to hash
   * @returns {string} SHA-256 hash of the refresh token
   */
  createHashRefreshToken(refreshToken) {
    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    return hash;
  }

  /**
   * Verifies and decodes an access token
   * @param {string} token - Access token to verify
   * @returns {Object} Decoded token payload
   * @returns {number} return.sub - User ID (subject)
   * @returns {string} return.email - User email
   * @returns {string} return.rol - User role
   * @returns {number} return.sessionId - Session ID
   * @returns {number} return.iat - Issued at timestamp
   * @returns {number} return.exp - Expiration timestamp
   * @throws {AuthenticationError} When token is expired or invalid
   */
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

  /**
   * Verifies and decodes a refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   * @returns {number} return.sub - User ID (subject)
   * @returns {number} return.iat - Issued at timestamp
   * @returns {number} return.exp - Expiration timestamp
   * @throws {AuthenticationError} When token is expired or invalid
   */
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

  /**
   * Decodes a token without verification (unsafe, for inspection only)
   * @param {string} token - Token to decode
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Creates SHA-256 hash of any token or string
   * @param {string} token - Token or string to hash
   * @returns {string} SHA-256 hash in hexadecimal format
   */
  createHash(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

module.exports = JwtAuth;
