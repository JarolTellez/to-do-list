const BaseDatabaseHandler = require("../../infrastructure/config/BaseDatabaseHandler");

class SessionService extends BaseDatabaseHandler {
  constructor({
    sessionDAO,
    sessionMapper,
    JwtAuth,
    connectionDB,
    erroFactory,
    validator,
  }) {
    super(connectionDB);
    this.sessionDAO = sessionDAO;
    this.sessionMapper = sessionMapper;
    this.JwtAuth = JwtAuth;
    this.erroFactory = erroFactory;
    this.validator = validator;
  }

  async manageUserSession(
    { userId, existingRefreshToken, deviceInfo, ip },
    externalConn = null
  ) {
    return this.withTransaction(async (connection) => {
      // 1. Verificar si ya existe una sesión activa válida
      let session = null;
      if (existingRefreshToken) {
        session = await this.validateExistingSession(
          userId,
          existingRefreshToken,
          connection
        );
      }

      // 2. Si no hay sesión válida, crear una nueva
      if (!session) {
        session = await this.createNewSession(
          userId,
          deviceInfo,
          ip,
          connection
        );
      }

      // 3. Gestionar límite de sesiones
      await this.manageSessionLimit(userId, 5, connection);

      return {
        refreshToken: session.refreshToken,
        sessionId: session.id,
      };
    }, externalConn);
  }

  async validateExistingSession(userId, refreshToken, externalConn = null) {
    try {
      const refreshTokenHash = this.jwtAuth.hashRefreshToken(refreshToken);
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
      return null;
    }
  }

  async createNewSession(userId, deviceInfo, ip, externalConn = null) {
    // Generar nuevo refresh token
    const refreshToken = this.jwtAuth.generateRefreshToken({ userId });
    const refreshTokenHash = this.jwtAuth.hashRefreshToken(refreshToken);

    // Crear DTO de sesión
    const createSessionRequestDTO = this.sessionMapper.requestDataToCreateDTO({
      userId: userId,
      refreshToken: refreshTokenHash,
      deviceId: deviceInfo.deviceId || null,
      userAgent: deviceInfo.userAgent || "Unknown",
      ip: ip,
      expiresInHours: 24 * 7, // 7 días
    });

    // Crear dominio de sesión
    const sessionDomain = this.sessionMapper.createRequestToDomain(
      createSessionRequestDTO
    );

    // Desactivar sesiones existentes del mismo dispositivo
    await this.sessionDAO.deactivateAllByUserIdAndDeviceId(
      userId,
      deviceInfo.deviceId,
      externalConn
    );

    // Guardar nueva sesión
    const createdSession = await this.sessionDAO.create(
      sessionDomain,
      externalConn
    );

    return {
      ...createdSession,
      refreshToken, // Devolver el token plano (no el hash)
    };
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
      return { isValid: false, error: "Error validando sesión" };
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
    const activeSessions = await this.sessionDAO.findAllByUserIdAndIsActive({
      userId: userId,
      active: true,
      externalConn: externalConn,
    });

    if (activeSessions.length >= maxSessions) {
      // Ordenar por fecha de creación y desactivar la más antigua
      const sortedSessions = activeSessions.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      await this.sessionDAO.deactivate(sortedSessions[0].id, externalConn);
      return { deactivated: true, message: "Sesión más antigua desactivada" };
    }

    return { deactivated: false, message: "Dentro del límite de sesiones" };
  }

  async deactivateAllUserSessions(userId, externalConn = null) {
    const result = await this.sessionDAO.deactivateAllByUserId(
      userId,
      externalConn
    );
    return {
      deactivated: result,
      message: result
        ? "Todas las sesiones desactivadas"
        : "No se encontraron sesiones activas",
    };
  }
  async refreshAccessToken(refreshToken) {}
}

module.exports = SessionService;
