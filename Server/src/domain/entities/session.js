const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const crypto = require("crypto");
const ms = require("ms");
const domainValidationConfig = require("../config/domainValidationConfig");

/**
 * Session domain entity representing user authentication sessions
 * @class Session
 * @description Manages session lifecycle, validation, and business rules for user authentication
 */
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

  /**
   * Creates a new Session instance with validated properties
   * @constructor
   * @param {Object} sessionData - Session initialization data
   * @param {string|number} [sessionData.id=null] - Unique session identifier
   * @param {string|number} sessionData.userId - User identifier associated with the session
   * @param {string} sessionData.refreshTokenHash - Hashed refresh token for security
   * @param {string} [sessionData.userAgent=null] - Client user agent string
   * @param {string} [sessionData.ip=null] - Client IP address
   * @param {Date} [sessionData.createdAt=new Date()] - Session creation timestamp
   * @param {Date} sessionData.expiresAt - Session expiration timestamp
   * @param {boolean} [sessionData.isActive=true] - Session active status
   * @throws {ValidationError} When business rules or validations fail
   */
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

  /**
   * Validates refresh token hash format and length
   * @private
   * @param {string} refreshTokenHash - Hashed refresh token to validate
   * @returns {string} Validated refresh token hash
   * @throws {ValidationError} When hash format is invalid
   */
  #validateRefreshTokenHash(refreshTokenHash) {
    return this.#validator.validateText(refreshTokenHash, "refreshTokenHash", {
      required: true,
      entity: "Session",
      min: this.#config.REFRESH_TOKEN_HASH.EXACT_LENGTH,
      max: this.#config.REFRESH_TOKEN_HASH.EXACT_LENGTH,
    });
  }

  /**
   * Validates IP address format and length
   * @private
   * @param {string} ip - IP address to validate
   * @returns {string|null} Validated IP address or null
   * @throws {ValidationError} When IP format is invalid
   */
  #validateIp(ip) {
    if (ip != null) {
      return this.#validator.validateText(ip, "ip", {
        required: false,
        entity: "Session",
        max: this.#config.IP.MAX_LENGTH,
      });
    }
    return null;
  }

  /**
   * Validates expiration date is in the future
   * @private
   * @param {Date} expiresAt - Expiration date to validate
   * @returns {Date} Validated expiration date
   * @throws {ValidationError} When expiration date is in the past
   */
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

  /**
   * Validates session business rules
   * @private
   * @throws {ValidationError} When business rules are violated
   */
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

  /**
   * Invalidates the session by marking it as inactive
   * @returns {void}
   */
  invalidate() {
    this.#isActive = false;
  }

  /**
   * Checks if the session has expired based on current time
   * @returns {boolean} True if session is expired, false otherwise
   */
  isExpired() {
    return new Date() > this.#expiresAt;
  }

  /**
   * Validates session is both active and not expired
   * @returns {boolean} True if session is valid
   * @throws {ValidationError} When session is inactive or expired
   */
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

  /**
   * Gets session unique identifier
   * @returns {string|number|null} Session ID
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets associated user identifier
   * @returns {string|number} User ID
   */
  get userId() {
    return this.#userId;
  }

  /**
   * Gets hashed refresh token
   * @returns {string} Refresh token hash
   */
  get refreshTokenHash() {
    return this.#refreshTokenHash;
  }

  /**
   * Gets client user agent
   * @returns {string|null} User agent string
   */
  get userAgent() {
    return this.#userAgent;
  }
  /**
   * Gets client IP address
   * @returns {string|null} IP address
   */
  get ip() {
    return this.#ip;
  }

  /**
   * Gets session creation timestamp
   * @returns {Date} Creation date
   */
  get createdAt() {
    return this.#createdAt;
  }
  /**
   * Gets session expiration timestamp
   * @returns {Date} Expiration date
   */
  get expiresAt() {
    return this.#expiresAt;
  }
  /**
   * Gets session active status
   * @returns {boolean} True if session is active
   */
  get isActive() {
    return this.#isActive;
  }

  /**
   * Calculates time remaining until session expiration
   * @returns {number} Milliseconds until expiration
   */
  timeUntilExpiration() {
    return this.#expiresAt - new Date();
  }

  /**
   * Factory method to create a new session with automatic expiration calculation
   * @static
   * @param {Object} sessionData - Session creation data
   * @param {string|number} sessionData.userId - User identifier
   * @param {string} sessionData.refreshTokenHash - Hashed refresh token
   * @param {string} [sessionData.userAgent] - Client user agent
   * @param {string} [sessionData.ip] - Client IP address
   * @param {string} [sessionData.expiresAt] - Expiration duration string
   * @param {boolean} [sessionData.active=true] - Initial active status
   * @returns {Session} New session instance
   * @throws {ValidationError} When duration or business rules are invalid
   */
  static create({
    userId,
    refreshTokenHash,
    userAgent,
    ip,
    expiresAt,
    active = true,
  }) {
    const createdAt = new Date();
    const expirationDuration =
      expiresAt || domainValidationConfig.SESSION.EXPIRATION.DEFAULT_DURATION;
    const expiresInMs = ms(expirationDuration);

    if (!expiresInMs || expiresInMs <= 0) {
      throw new ValidationError("Valor de expiración inválido", {
        entity: "Session",
        field: "expiresAt",
        value: expirationDuration,
      });
    }

    const minDurationMs = ms(
      domainValidationConfig.SESSION.EXPIRATION.MIN_DURATION
    );
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

  /**
   * Converts session to plain object for serialization
   * @returns {Object} Session data as plain object
   */
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
      maxActiveSessions:
        domainValidationConfig.RELATIONSHIPS.SESSION.MAX_ACTIVE_SESSIONS,
    };
  }
}

module.exports = Session;
