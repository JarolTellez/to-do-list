const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const crypto = require("crypto");
const ms = require("ms");
const domainValidationConfig = require("../config/domainValidationConfig");

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
  #config;

  constructor({
    id = null,
    userId,
    refreshTokenHash,
    userAgent = null,
    ip = null,
    createdAt = new Date(),
    expiresAt,
    isActive = true,
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.SESSION;

    this.#id = this.#validator.validateId(id, "Session");
    this.#userId = this.#validator.validateId(userId, "User");
    this.#refreshTokenHash = this.#validateRefreshTokenHash(refreshTokenHash);
    this.#userAgent = this.#validator.validateText(userAgent, "userAgent", {
      required: false,
      entity: "Session",
      max: this.#config.USER_AGENT.MAX_LENGTH,
    });
    this.#ip = this.#validateIp(ip);
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "Session",
    });
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
      min: this.#config.REFRESH_TOKEN_HASH.EXACT_LENGTH,
      max:  this.#config.REFRESH_TOKEN_HASH.EXACT_LENGTH,
    });
  }

  #validateIp(ip) {
    if (ip != null) {
      return this.#validator.validateText(ip, "ip", {
        required: false,
        entity: "Session",
        max:  this.#config.IP.MAX_LENGTH,
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
      throw new ValidationError(
        "La fecha de expiración debe ser en el futuro",
        {
          entity: "Session",
          field: "expiresAt",
          value: date,
        }
      );
    }

    return date;
  }

  #validateBusinessRules() {
    if (this.#expiresAt <= this.#createdAt) {
      throw new ValidationError(
        "La fecha de expiración debe ser después de la fecha de creación",
        {
          entity: "Session",
          field: "expiresAt",
          createdAt: this.#createdAt,
          expiresAt: this.#expiresAt,
        }
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
      throw new ValidationError("La sesión no está activa", {
        entity: "Session",
        sessionId: this.#id,
      });
    }

    if (this.isExpired()) {
      throw new ValidationError("La sesión ha expirado", {
        entity: "Session",
        sessionId: this.#id,
        expiredAt: this.#expiresAt.toISOString(),
        currentTime: new Date().toISOString(),
      });
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

  static create({
    userId,
    refreshTokenHash,
    userAgent,
    ip,
    expiresAt,
    active = true,
  }) {
    const createdAt = new Date();
    const expirationDuration = expiresAt || domainValidationConfig.SESSION.EXPIRATION.DEFAULT_DURATION;
    const expiresInMs = ms(expirationDuration);;

    if (!expiresInMs || expiresInMs <= 0) {
      throw new ValidationError("Valor de expiración inválido", {
        entity: "Session",
        field: "expiresAt",
        value: expirationDuration,
      });
    }

    const minDurationMs = ms(domainValidationConfig.SESSION.EXPIRATION.MIN_DURATION);
    if (expiresInMs < minDurationMs) {
      throw new ValidationError(
        `La duración de la sesión no puede ser menor a ${domainValidationConfig.SESSION.EXPIRATION.MIN_DURATION}`,
        {
          entity: "Session",
          field: "expiresAt",
          value: expirationDuration,
          minAllowed: domainValidationConfig.SESSION.EXPIRATION.MIN_DURATION,
        }
      );
    }

    const expirationDate = new Date(createdAt.getTime() + expiresInMs);

    return new Session({
      userId,
      refreshTokenHash,
      userAgent,
      ip,
      createdAt,
      expiresAt: expirationDate,
      isActive: active,
    });
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
      maxActiveSessions: domainValidationConfig.RELATIONSHIPS.SESSION.MAX_ACTIVE_SESSIONS,
    };
  }
}

module.exports = Session;
