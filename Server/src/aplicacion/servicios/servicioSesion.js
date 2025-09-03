const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class ServicioSesion extends BaseDatabaseHandler {
  constructor(SesionDAO, JwtAuth, AuthenticationError, conexionBD) {
    super(conexionBD);
    this.SesionDAO = SesionDAO;
    this.JwtAuth = JwtAuth;
    this.AuthenticationError = AuthenticationError;
  }

  async registrarSesion(sesion, externalConn = null) {
    if (!sesion || !sesion.idUsuario || !sesion.refreshTokenHash) {
      throw new Error("Faltan datos requeridos: idUsuario o refreshTokenHash");
    }

    return this.withTransaction(async (connection) => {
      // Desactivar sesiónes existentes del mismo dispositivo
      const resultadoDesactivacion =
        await this.SesionDAO.desactivarPorIdUsuarioIdDispositivo(
          sesion.idUsuario,
          sesion.idDispositivo,
          connection
        );
      // Guardar nueva sesión
      const resultadoSesion = await this.SesionDAO.guardarSesion(
        sesion,
        connection
      );

      return resultadoSesion;
    }, externalConn);
  }

  async deactivateSession(userId, refreshTokenHash, externalConn = null) {
    if (!userId || !refreshTokenHash) {
      throw new Error("Falta el userId o refreshTokenHash");
    }
    console.log("datos", userId, refreshTokenHash);
    return this.withTransaction(async (connection) => {
      const validateSession = await this.verificarSesionValida(
        userId,
        refreshTokenHash,
        connection
      );


      console.log("VALIDATE SESSION: ", validateSession);
      if(!validateSession){
        return null
      }
  
      if ( new Date() > new Date(validateSession.fechaExpiracion)) {
         throw new this.AuthenticationError("Sesión ya expirada");
      }
      const result = await this.SesionDAO.desactivarSesionPorId(
        validateSession.idSesion,
        connection
      );
    
      return result;
    }, externalConn);
  }

  async verificarSesionValida(
    idUsuario,
    refreshTokenHash,
    externalConn = null
  ) {
    if (!idUsuario || !refreshTokenHash) {
      throw new Error("Faltan datos requeridos: IdUsuario o RefreshToken");
    }
    return this.withTransaction(async (connection) => {
      const sesion =
        await this.SesionDAO.consultarSesionesActivasPorIdUsuarioRTHash(
          idUsuario,
          refreshTokenHash,
          connection
        );

      if (!sesion) {
        throw new AuthenticationError('Sesión no encontrada o token inválido', {
        idUsuario,
        tokenHash: refreshTokenHash.substring(0, 10) + '...' 
      });
      }

      return sesion;
    }, externalConn);
  }

  async gestionarLimiteDeSesiones(
    idUsuario,
    maximoSesiones,
    externalConn = null
  ) {
    if (!idUsuario) {
      throw new Error("Faltan datos requeridos: idUsuario");
    }
    return this.withTransaction(async (connection) => {
      const sesionesActivas =
        await this.SesionDAO.consultarSesionesActivasPorIdUsuario(
          idUsuario,
          connection
        );

      if (sesionesActivas >= maximoSesiones) {
        const eliminada = await this.SesionDAO.desactivarSesionMasAntigua(
          idUsuario,
          connection
        );

        if (!eliminada) {
          throw new Error("No se pudo liberar espacio de sesiones");
        }

        return { eliminada: true, mensaje: "Sesión más antigua eliminada" };
      }

      return { eliminada: false, mensaje: "Dentro del límite" };
    }, externalConn);
  }

  async renovarAccessToken(refreshToken) {}
}

module.exports = ServicioSesion;
