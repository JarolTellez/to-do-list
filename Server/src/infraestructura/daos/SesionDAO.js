const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");


class SesionDAO extends BaseDatabaseHandler{
  constructor(sesionMapper, conexionBD, DatabaseError, NotFoundError, ConflictError) {
    super(conexionBD);
    this.sesionMapper = sesionMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

  // Guardar una nueva sesión
  async guardarSesion(sesion, externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "INSERT INTO sesiones (id_usuario, refresh_token_hash, id_dispositivo, user_agent, ip, fecha_creacion, fecha_expiracion, activa) VALUES (?,?,?,?,?,?,?,?)",
        [
          sesion.idUsuario,
          sesion.refreshTokenHash,
          sesion.idDispositivo,
          sesion.userAgent,
          sesion.ip,
          sesion.fechaCreacion,
          sesion.fechaExpiracion,
          sesion.activa
        ]
      );

      // Asignar el ID generado
      sesion.idRefreshToken = resultado.insertId;

      return sesion;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe una sesión activa para este dispositivo',
          { idDispositivo: sesion.idDispositivo, idUsuario: sesion.idUsuario }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo guardar la sesión',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Desactivar una sesión por ID de la sesion
  async desactivarSesionPorId(idSesion, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "UPDATE sesiones SET activa = FALSE WHERE id_sesion = ?",
        [idSesion]
      );
      
      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError('La sesión no existe');
      }
      
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo desactivar la sesión',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Desactivar todas las sesiones de un usuario
  async desactivarTodasPorIdUsuario(idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "UPDATE sesiones SET activa=FALSE WHERE id_usuario=?",
        [idUsuario]
      );
     
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo desactivar todas las sesiones del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async desactivarPorIdUsuarioIdDispositivo(idUsuario, idDispositivo, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "UPDATE sesiones SET activa = FALSE WHERE id_usuario = ? AND id_dispositivo = ?",
        [idUsuario, idDispositivo]
      );
      
        if (resultado.affectedRows === 0) {
      return { desactivadas: 0, mensaje: 'No habia sesiones para desactivar' };
    }
    
    return { desactivadas: resultado.affectedRows, mensaje: 'Sesion desactivada' };
      
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo desactivar la sesión del dispositivo',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async desactivarSesionMasAntigua(idUsuario, externalConn = null) {
  const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(`
        DELETE FROM sesiones 
        WHERE id_usuario = ? 
        ORDER BY fecha_creacion ASC 
        LIMIT 1
      `, [idUsuario]);

      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError('No se encontraron sesiones para este usuario');
      }

      return resultado.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo eliminar la sesión más antigua del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Consultar todas las sesiones de un usuario
  async consultarSesionesPorIdUsuario(idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultados] = await connection.execute(
        "SELECT * FROM sesiones WHERE id_usuario = ?",
        [idUsuario]
      );
      
      const sesionesDominio = resultados.map(elemento => this.sesionMapper.bdToDominio(elemento));
      return sesionesDominio;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las sesiones del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async consultarSesionesActivasPorIdUsuario(idUsuario, externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultados] = await connection.execute(
        "SELECT * FROM sesiones WHERE id_usuario = ? AND activa = TRUE",
        [idUsuario]
      );
      
      const sesionesDominio = resultados.map(elemento => this.sesionMapper.bdToDominio(elemento));
      return sesionesDominio;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las sesiones activas del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async consultarSesionesActivasPorIdUsuarioRTHash(idUsuario, refreshTokenHash, externalConn = null) {
  const {connection, isExternal} = await this.getConnection(externalConn);
    
    try {
      const [resultados] = await connection.execute(
        "SELECT * FROM sesiones WHERE id_usuario = ? AND refresh_token_hash = ? AND activa = TRUE",
        [idUsuario, refreshTokenHash]
      );
      
      if (resultados.length === 0) {
        return null;
      }

      const sesionDominio = this.sesionMapper.bdToDominio(resultados[0]);
      return sesionDominio;

    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar la sesión activa',
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Consultar una sesión por refresh token hash
  async consultarSesionPorRefreshTokenHash(refreshTokenHash, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultados] = await connection.execute(
        "SELECT * FROM sesiones WHERE refresh_token_hash = ?",
        [refreshTokenHash]
      );

      if (resultados.length === 0) {
        return null; 
      }

      const sesionBD = resultados[0];
      return this.sesionMapper.bdToDominio(sesionBD);
      
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar la sesión por token de refresco',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = SesionDAO;