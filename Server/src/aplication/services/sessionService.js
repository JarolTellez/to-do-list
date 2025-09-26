
const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");

class SessionService extends TransactionsHandler {
  constructor({
    sessionDAO,
    sessionMapper,
    jwtAuth,
    connectionDB,
    erroFactory,
    validator,
  }) {
    super(connectionDB);
    this.sessionDAO = sessionDAO;
    this.sessionMapper = sessionMapper;
    this.jwtAuth = jwtAuth;
    this.erroFactory = erroFactory;
    this.validator = validator;
  }

  async manageUserSession(
    { userId, existingRefreshToken, userAgent, ip },
    externalConn = null
  ) {
    return this.withTransaction(async (connection) => {
      let session = null;
      if (existingRefreshToken) {
        session = await this.validateExistingSession(
          userId,
          existingRefreshToken,
          connection
        );
      }

      if (!session) {
        session = await this.createNewSession(
          {
            userId,
            userAgent,
            ip,
          },
          connection
        );
      }

      await this.manageSessionLimit(userId, 5, connection);

      return {
        refreshToken: session.refreshToken,
        sessionId: session.id,
      };
    }, externalConn);
  }

  async validateExistingSession(userId, refreshToken, externalConn = null) {
    try {
      const refreshTokenHash =
        this.jwtAuth.createHashRefreshToken(refreshToken);
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        externalConn
      );

      if (
        !session ||
        session.userId !== userId ||
        !session.isActive ||
        new Date() > session.expiresAt
      ) {
        return null;
      }

      return session;
    } catch (error) {
      throw error;
    }
  }

  async createNewSession({ userId, userAgent, ip }, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const refreshToken = this.jwtAuth.createRefreshToken(userId);

      const createSessionRequestDTO = this.sessionMapper.requestDataToCreateDTO(
        {
          userId: userId,
          refreshToken: refreshToken,
          userAgent: userAgent || "Unknown",
          ip: ip,
          expiresInHours: 24 * 7, // 7 días
        }
      );

      const sessionDomain = this.sessionMapper.createRequestToDomain(
        createSessionRequestDTO
      );

      const createdSession = await this.sessionDAO.create(
        sessionDomain,
        connection
      );
      return {
        ...createdSession,
        refreshToken, // Devuelve el token plano (no el hash)
      };
    }, externalConn);
  }

  async validateActiveSession(refreshToken, externalConn = null) {
    try {
      const refreshTokenHash = this.jwtAuth.hashRefreshToken(refreshToken);
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        externalConn
      );

      if (!session) {
        return { isValid: false, error: "Sesión no encontrada" };
      }

      if (!session.isActive) {
        return { isValid: false, error: "Sesión inactiva" };
      }

      if (new Date() > session.expiresAt) {
        return { isValid: false, error: "Sesión expirada" };
      }

      return { isValid: true, session };
    } catch (error) {
      throw error;
    }
  }

  async logOutSession(refreshToken, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const refreshTokenHash = this.jwtAuth.hashRefreshToken(refreshToken);
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        connection
      );

      if (session) {
        await this.sessionDAO.deactivate(session.id, connection);
        return { message: "Sesión cerrada exitosamente" };
      }

      return { message: "Sesión no encontrada" };
    }, externalConn);
  }

  async manageSessionLimit(userId, maxSessions = 5, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const activeCount = await this.sessionDAO.countAllByUserIdAndIsActive(
        userId,
        true,
        externalConn
      );

      if (activeCount >= maxSessions) {
        const deactivated = await this.sessionDAO.deactivateOldestByUserId(
          userId,
          connection
        );

        return {
          deactivated: deactivated,
          message: deactivated
            ? "Sesión más antigua desactivada"
            : "No había sesiones para desactivar",
        };
      }

      return { deactivated: false, message: "Dentro del límite de sesiones" };
    }, externalConn);
  }
  async deactivateAllUserSessions(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const result = await this.sessionDAO.deactivateAllByUserId(
        userId,
        connection
      );
      return {
        deactivated: result,
        message: result
          ? "Todas las sesiones desactivadas"
          : "No se encontraron sesiones activas",
      };
    }, externalConn);
  }
  async refreshAccessToken(refreshToken) {}
}

module.exports = SessionService;
