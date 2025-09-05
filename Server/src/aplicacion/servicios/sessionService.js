const BaseDatabaseHandler = require('../../infraestructura/config/BaseDatabaseHandler');

class SessionService extends BaseDatabaseHandler {
  constructor({sessionDAO, JwtAuth, AuthenticationError, connectionDB}) {
    super(connectionDB);
    this.sessionDAO = sessionDAO;
    this.JwtAuth = JwtAuth;
    this.AuthenticationError = AuthenticationError;
  }

  async createSession(session, externalConn = null) {
    if (!session || !session.userId || !session.refreshTokenHash) {
      throw new Error('Faltan datos requeridos: userId o refreshTokenHash');
    }

    return this.withTransaction(async (connection) => {
      // Desactivar sesiónes existentes del mismo dispositivo
      const deactivationResponse =
        await this.sessionDAO.desactivarPorIdUsuarioIdDispositivo(
          session.userId,
          session.deviceId,
          connection
        );
      // Guardar nueva sesión
      const sessionResponse = await this.sessionDAO.guardarSesion(
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
    console.log('datos', userId, refreshTokenHash);
    return this.withTransaction(async (connection) => {
      const validateSession = await this.verificarSesionValida(
        userId,
        refreshTokenHash,
        connection
      );


      console.log('VALIDATE SESSION: ', validateSession);
      if(!validateSession){
        return null
      }
  
      if ( new Date() > new Date(validateSession.fechaExpiracion)) {
         throw new this.AuthenticationError('Sesión ya expirada');
      }
      const result = await this.sessionDAO.desactivarSesionPorId(
        validateSession.idSesion,
        connection
      );
    
      return result;
    }, externalConn);
  }

  async verificarSesionValida(
    userId,
    refreshTokenHash,
    externalConn = null
  ) {
    if (!userId || !refreshTokenHash) {
      throw new Error('Faltan datos requeridos: IdUsuario o RefreshToken');
    }
    return this.withTransaction(async (connection) => {
      const session =
        await this.sessionDAO.consultarSesionesActivasPorIdUsuarioRTHash(
          userId,
          refreshTokenHash,
          connection
        );

      if (!session) {
        throw new this.AuthenticationError('Sesión no encontrada o token inválido', {
        userId,
        tokenHash: refreshTokenHash.substring(0, 10) + '...' 
      });
      }

      return session;
    }, externalConn);
  }

  async gestionarLimiteDeSesiones(
    userId,
    maximoSesiones,
    externalConn = null
  ) {
    if (!userId) {
      throw new Error('Faltan datos requeridos: userId');
    }
    return this.withTransaction(async (connection) => {
      const sesionesActivas =
        await this.sessionDAO.consultarSesionesActivasPorIdUsuario(
          userId,
          connection
        );

      if (sesionesActivas >= maximoSesiones) {
        const eliminada = await this.sessionDAO.desactivarSesionMasAntigua(
          userId,
          connection
        );

        if (!eliminada) {
          throw new Error('No se pudo liberar espacio de sesiones');
        }

        return { eliminada: true, mensaje: 'Sesión más antigua eliminada' };
      }

      return { eliminada: false, mensaje: 'Dentro del límite' };
    }, externalConn);
  }

  async renovarAccessToken(refreshToken) {}
}

module.exports = SessionService;
