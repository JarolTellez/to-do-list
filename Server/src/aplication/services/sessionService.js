const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");

class SessionService extends TransactionsHandler {
  constructor({
    sessionDAO,
    sessionMapper,
    connectionDB,
    erroFactory,
    validator,
    appConfig,
  }) {
    super(connectionDB);
    this.sessionDAO = sessionDAO;
    this.sessionMapper = sessionMapper;
    this.erroFactory = erroFactory;
    this.validator = validator;
    this.appConfig = appConfig;
  }

  // async manageUserSession(
  //   { userId, existingRefreshToken, userAgent, ip },
  //   externalConn = null
  // ) {
  //   return this.withTransaction(async (connection) => {
  //     let session = null;
  //     let NewRefreshToken = null;
  //     if (existingRefreshToken) {
  //       session = await this.validateExistingSession(
  //         userId,
  //         existingRefreshToken,
  //         connection
  //       );
  //     }

  //     if (!session) {
  //       const { createdSession, refreshToken } = await this.createNewSession(
  //         {
  //           userId,
  //           userAgent,
  //           ip,
  //         },
  //         connection
  //       );
  //       session = createdSession;
  //     }

  //     await this.manageSessionLimit(
  //       userId,
  //       this.appConfig.session.maxActive,
  //       connection
  //     );

  //     return {
  //       refreshToken: NewRefreshToken,
  //       session,
  //     };
  //   }, externalConn);
  // }

  async validateExistingSession(userId, refreshTokenHash, externalConn = null) {
    try {
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

  async createNewSession(
    { userId, refreshTokenHash, userAgent, ip },
    externalConn = null
  ) {
    return this.withTransaction(async (connection) => {
      const sessionDomain = this.sessionMapper.createRequestToDomain({
        userId: userId,
        refreshTokenHash: refreshTokenHash,
        userAgent: userAgent || "Unknown",
        ip: ip,
        expiresAt: this.appConfig.jwt.refresh.expiresIn,
        isActive: true,
      });

      const createdSession = await this.sessionDAO.create(
        sessionDomain,
        connection
      );
      return createdSession;
    }, externalConn);
  }

  async validateSession(userId, refreshTokenHash, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        connection
      );
      if (session) {
        const isValid =
          session.userId === userId &&
          session.isActive &&
          new Date(session.expiresAt) > new Date();

        if (isValid) {
          return session; 
        } else {
          await this.sessionDAO.deactivate(session.id, connection);
          return null;
        }
      }

      return null;
    }, externalConn);
  }

  async deactivateSession(userId, refreshTokenHash, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        connection
      );

      if (session) {
        if (session.userId !== userId) {
          throw this.errorFactory.createAuthenticationError(
            "El token no corresponde al usuario"
          );
        }
        await this.sessionDAO.deactivate(session.id, connection);
        return { success: true, userId: session.userId };
      }

      return { success: false };
    }, externalConn);
  }

  async manageSessionLimit(userId, maxSessions = 10, externalConn = null) {
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
