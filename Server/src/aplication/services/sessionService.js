const BaseDatabaseHandler = require('../../infrastructure/config/BaseDatabaseHandler');

class SessionService extends BaseDatabaseHandler {
  constructor({sessionDAO, JwtAuth, AuthenticationError, connectionDB, NotFoundError}) {
    super(connectionDB);
    this.sessionDAO = sessionDAO;
    this.JwtAuth = JwtAuth;
    this.AuthenticationError = AuthenticationError;
    this.NotFoundError=NotFoundError;
  }

  async createSession(session, externalConn = null) {
    if (!session || !session.userId || !session.refreshTokenHash) {
      throw new Error('Faltan datos requeridos: userId o refreshTokenHash');
    }

    return this.withTransaction(async (connection) => {
      // Desactivar sesiónes existentes del mismo dispositivo
      const deactivationResponse =
        await this.sessionDAO.deactivateByUserIdAndDeviceId(
          session.userId,
          session.deviceId,
          connection
        );
      // Guardar nueva sesión
      const sessionResponse = await this.sessionDAO.create(
        session,
        connection
      );

      return sessionResponse;
    }, externalConn);
  }

  async deactivateSession(userId, refreshTokenHash, externalConn = null) {
    if (!userId || !refreshTokenHash) {
      throw new Error('Falta el userId o refreshTokenHash');
    }
   
    return this.withTransaction(async (connection) => {
      const validateSession = await this.verifyValidSession(
        userId,
        refreshTokenHash,
        connection
      );

      if(!validateSession){
        return null
      }
  
      if ( new Date() > new Date(validateSession.fechaExpiracion)) {
         throw new this.AuthenticationError('Sesión ya expirada');
      }
      const result = await this.sessionDAO.deactivateById(
        validateSession.id,
        connection
      );
    
      return result;
    }, externalConn);
  }

  async verifyValidSession(
    userId,
    refreshTokenHash,
    externalConn = null
  ) {
    if (!userId || !refreshTokenHash) {
      throw new Error('Faltan datos requeridos: IdUsuario o RefreshToken');
    }
    return this.withTransaction(async (connection) => {
      const session = await this.sessionDAO.findAllActivesSessionsByUserIdAndRtHash(
          userId,
          refreshTokenHash,
          connection
        );

      // if (!session) {
      //   throw new this.AuthenticationError('Sesión no encontrada o token inválido', {
      //   userId,
      //   tokenHash: refreshTokenHash.substring(0, 10) + '...' 
      // });
      // }

      return session;
    }, externalConn);
  }

  async manageSessionLimit(
    userId,
    maximoSesiones,
    externalConn = null
  ) {
    if (!userId) {
      throw new Error('Faltan datos requeridos: userId');
    }
    return this.withTransaction(async (connection) => {
      const activeSessions =
        await this.sessionDAO.findAllActiveSessionsByUserId(
          userId,
          connection
        );

      if (activeSessions >= maximoSesiones) {
        const deactivated = await this.sessionDAO.deactivateOldestByUserId(
          userId,
          connection
        );

        if (!deactivated) {
          throw new Error('No se pudo liberar espacio de sesiones');
        }

        return { deactivated: true, message: 'Sesión más antigua deactivated' };
      }

      return { deactivated: false, message: 'Dentro del límite' };
    }, externalConn);
  }

  async refreshAccessToken(refreshToken) {}
}

module.exports = SessionService;
