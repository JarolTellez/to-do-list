const { ValidationError } = require("../../utils/appErrors");
const errorCodes = require('../../utils/errorCodes');
const crypto = require("crypto");

class Session {
  #id;
  #userId;
  #refreshTokenHash;
  #deviceId;
  #userAgent;
  #ip;
  #createdAt;
  #expiresAt;
  #isActive;
  constructor({
    id = null,
    userId,
    refreshTokenHash,
    deviceId = null,
    userAgent,
    ip,
    createdAt = new Date(),
    expiresAt,
    isActive = true,
  }) {
    this.#id = id;
    this.#userId = userId;
    this.#refreshTokenHash = refreshTokenHash;
    this.#deviceId = deviceId;
    this.#userAgent = userAgent;
    this.#ip = ip;
    this.#createdAt =
      createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.#expiresAt =
      expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    this.#isActive = isActive;

    this.validate();
  }

  invalidate() {
    this.#isActive = false;
  }

  isExpired() {
    return new Date() > this.#expiresAt;
  }

  isValid() {
    if (!this.#isActive) {
      throw new ValidationError(
        "Session is not active",
        { sessionId: this.#id },
        errorCodes.SESSION_INVALID
      );
    }

    if (this.isExpired()) {
      throw new ValidationError(
        "Session expired",
        {
          sessionId: this.#id,
          expiredAt: this.#expiresAt.toISOString(),
          currentTime: new Date().toISOString(),
        },
        errorCodes.SESSION_EXPIRED
      );
    }

    return true;
  }

  validate() {
    const errors = [];

    if (!this.#userId) {
      errors.push({
        field: "userId",
        message: "User ID is required",
        code: errorCodes.REQUIRED_FIELD,
      });
    }

    if (!this.#refreshTokenHash) {
      errors.push({
        field: "refreshTokenHash",
        message: "Refresh token hash is required",
        code: errorCodes.REQUIRED_FIELD,
      });
    }

    if (!this.#expiresAt) {
      errors.push({
        field: "expiresAt",
        message: "Expiration date is required",
        code: errorCodes.REQUIRED_FIELD,
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("invalid session data", errors, errorCodes.SESSION_VALIDATION_ERROR);
    }
  }

  get id() {
    return this.#id;
  }
  get userId() {
    return this.#userId;
  }
  get refreshTokenHash() {
    return this.#refreshTokenHash;
  }
  get deviceId() {
    return this.#deviceId;
  }
  get userAgent() {
    return this.#userAgent;
  }
  get ip() {
    return this.#ip;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get expiresAt() {
    return this.#expiresAt;
  }
  get isActive() {
    return this.#isActive;
  }

    static create({
    userId,
    refreshToken,
    deviceId = null,
    userAgent,
    ip,
    expiresInHours = 24 * 7, // 7 dias 
    active
  }) {
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresInHours * 60 * 60 * 1000);

    return new Session({
      userId,
      refreshTokenHash,
      deviceId,
      userAgent,
      ip,
      createdAt,
      expiresAt,
      isActive: active?active:true,
    });
  }

  toJSON() {
    return {
      id: this.#id,
      userId: this.#userId,
      deviceId: this.#deviceId,
      userAgent: this.#userAgent,
      ip: this.#ip,
      createdAt: this.#createdAt.toISOString(),
      expiresAt: this.#expiresAt.toISOString(),
      isActive: this.#isActive,
    };
  }
}

module.exports = Session;
