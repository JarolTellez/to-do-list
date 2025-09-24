const DomainValidators = require("../utils/domainValidators");
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
  #validator;

  constructor(
    {
      id = null,
      userId,
      refreshTokenHash,
      deviceId = null,
      userAgent,
      ip,
      createdAt = new Date(),
      expiresAt,
      isActive = true,
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);

    this.#id = this.#validator.validateId(id, "Session");
    this.#userId = this.#validator.validateId(userId, "User");
    this.#refreshTokenHash = this.#validateRefreshTokenHash(refreshTokenHash);
    this.#deviceId = this.#validateDeviceId(deviceId);
    this.#userAgent = this.#validator.validateText(userAgent, "userAgent", {
      required: true,
      entity: "Session",
    });
    this.#ip = this.#validateIp(ip);
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#expiresAt = this.#validateExpiresAt(expiresAt);
    this.#isActive = this.#validator.validateBoolean(
      isActive,
      "isActive",
      "Session"
    );

    this.#validateBusinessRules();
  }

  #validateRefreshTokenHash(refreshTokenHash) {
    return this.#validator.validateText(refreshTokenHash, "refreshTokenHash", {
      required: true,
      entity: "Session",
      min: 64,
      max: 64,
    });
  }

  #validateDeviceId(deviceId) {
    if (deviceId === null || deviceId === undefined) return null;
    return this.#validator.validateText(deviceId, "deviceId", {
      max: 100,
      entity: "Session",
    });
  }

  #validateIp(ip) {
    return this.#validator.validateText(ip, "ip", {
      required: true,
      entity: "Session",
      max: 45,
    });
  }

  #validateExpiresAt(expiresAt) {
    const date = this.#validator.validateDate(expiresAt, "expiresAt", {
      required: true,
      entity: "Session",
    });

    if (date <= new Date()) {
      throw this.#validator.error.createValidationError(
        "Expiration date must be in the future",
        { field: "expiresAt", value: date },
        this.#validator.codes.INVALID_DATE
      );
    }

    return date;
  }

  #validateBusinessRules() {
    if (this.#expiresAt <= this.#createdAt) {
      throw this.#validator.error.createValidationError(
        "Expiration date must be after creation date",
        {
          field: "expiresAt",
          createdAt: this.#createdAt,
          expiresAt: this.#expiresAt,
        },
        this.#validator.codes.BUSINESS_RULE_VIOLATION
      );
    }
  }

  invalidate() {
    this.#isActive = false;
  }

  isExpired() {
    return new Date() > this.#expiresAt;
  }

  isValid() {
    if (!this.#isActive) {
      throw this.#validator.error.createValidationError(
        "Session is not active",
        { sessionId: this.#id },
        this.#validator.codes.SESSION_INVALID
      );
    }

    if (this.isExpired()) {
      throw this.#validator.error.createValidationError(
        "Session expired",
        {
          sessionId: this.#id,
          expiredAt: this.#expiresAt.toISOString(),
          currentTime: new Date().toISOString(),
        },
        this.#validator.codes.SESSION_EXPIRED
      );
    }

    return true;
  }

  // getters
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

    timeUntilExpiration() {
    return this.#expiresAt - new Date();
  }

 static create({
    userId,
    refreshToken,
    deviceId = null,
    userAgent,
    ip,
    expiresInHours = 24 * 7,
    active = true
  }, errorFactory) {
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
      isActive: active,
    }, errorFactory);
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
      isExpired: this.isExpired(),
      timeUntilExpiration: this.timeUntilExpiration(),
    };
  }
}

module.exports = Session;
