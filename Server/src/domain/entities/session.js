const DomainValidators = require("../utils/domainValidators");
const crypto = require("crypto");
const ms = require("ms");

class Session {
  #id;
  #userId;
  #refreshTokenHash;
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
      userAgent = null,
      ip = null,
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
    this.#userAgent = this.#validator.validateText(userAgent, "userAgent",  {
      required: false,
      entity: "Session",
      max: 500 
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

  #validateIp(ip) {
    if (ip != null) {
      return this.#validator.validateText(ip, "ip", {
        required: true,
        entity: "Session",
        max: 45,
      });
    }
    return null;
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

  static create(
    {
      userId,
      refreshTokenHash,
      userAgent,
      ip,
      expiresAt = "7d",
      active = true,
    },
    errorFactory
  ) {
    const createdAt = new Date();
    const expiresInMs = ms(expiresAt);
    if (!expiresInMs || expiresInMs <= 0) {
      throw new Error("Invalid expiresAt value");
    }
    const expirationDate = new Date(createdAt.getTime() + expiresInMs);

    return new Session(
      {
        userId,
        refreshTokenHash,
        userAgent,
        ip,
        createdAt,
        expiresAt: expirationDate,
        isActive: active,
      },
      errorFactory
    );
  }

  toJSON() {
    return {
      id: this.#id,
      userId: this.#userId,
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
