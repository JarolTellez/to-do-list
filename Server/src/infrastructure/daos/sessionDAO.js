const BaseDatabaseHandler = require('../config/BaseDatabaseHandler');


class SessionDAO extends BaseDatabaseHandler{
  constructor({sessionMapper, connectionDB, DatabaseError, NotFoundError, ConflictError}) {
    super(connectionDB);
    this.sessionMapper = sessionMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

  // Guardar una nueva sesión
  async create(session, externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'INSERT INTO sessions (user_id, refresh_token_hash, device_id, user_agent, ip, created_at, expires_at, is_active) VALUES (?,?,?,?,?,?,?,?)',
        [
          session.userId,
          session.refreshTokenHash,
          session.deviceId,
          session.userAgent,
          session.ip,
          session.createdAt,
          session.expiresAt,
          session.isActive
        ]
      );

      // Asignar el ID generado
      session.idRefreshToken = result.insertId;

      return session;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe una sesion para este dispositivo',
          {attemptedData:{userId:session.userId, deviceId: session.deviceId} }
        );
      }
      
      throw new this.DatabaseError(
        'Error al crear la sesion en la base de datos',
        {attemptedData:{attemptedData:{userId:session.userId, deviceId: session.deviceId}}, originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Desactivar una sesión por ID de la session
  async deactivateById(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'UPDATE sessions SET is_active = FALSE WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('No se encontro la session especificada',{sessionId: id});
      }
      return result.affectedRows
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'Error al desactivar la sesion en la base de datos',
        {   attemptedData:{sessionId:id},
            originalError: error.message,
            code: error.code
         }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Desactivar todas las sessions de un usuario
  async deactivateByUserId(userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'UPDATE sessions SET is_active=FALSE WHERE user_id=?',
        [userId]
      );
     return result;
    } catch (error) {
      throw new this.DatabaseError(
        'Error al desactivar las sesiones del usuario en la base de datos',
        {attemptedData:{userId: userId}, originalError: error.message, code: error.code, userId: userId }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async deactivateByUserIdAndDeviceId(userId, deviceId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'UPDATE sessions SET is_active = FALSE WHERE user_id = ? AND device_id = ?',
        [userId, deviceId]
      );
      
        if (result.affectedRows === 0) {
      return { desactivadas: 0, message: 'No habia sessions para desactivar' };
    }
    
    return { deactivated: result.affectedRows, message: 'Sesion desactivada' };
      
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'Error al desactivar la  sesion en la base de datos',
        { attemptedData:{userId:userId, deviceId: deviceId},originalError: error.message, code: error.code, userId: userId, deviceId: deviceId }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async deactivateOldestByUserId(userId, externalConn = null) {
  const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(`
        DELETE FROM sessions 
        WHERE user_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `, [userId]);

      if (result.affectedRows === 0) {
        throw new this.NotFoundError('No se encontraron sessions para este usuario');
      }

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo eliminar la sesión más antigua del usuario en la base de datos',
        { attemptedData:{userId:userId},originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Consultar todas las sessions de un usuario
  async findAllByUserId(userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'SELECT * FROM sessions WHERE user_id = ?',
        [userId]
      );
      
      const mappedSessions = result.map(elemento => this.sessionMapper.dbToDomain(elemento));
      return mappedSessions;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las sessions del usuario',
        { attemptedData:{userId:userId},originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findAllActiveSessionsByUserId(userId, externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'SELECT * FROM sessions WHERE user_id = ? AND is_active = TRUE',
        [userId]
      );
      
      const mappedSessions = result.map(elemento => this.sessionMapper.dbToDomain(elemento));
      return mappedSessions;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las sessions activas del usuario',
        { attemptedData:{userId:userId}, originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findAllActivesSessionsByUserIdAndRtHash(userId, refreshTokenHash, externalConn = null) {
  const {connection, isExternal} = await this.getConnection(externalConn);
    
    try {
      const [result] = await connection.execute(
        'SELECT * FROM sessions WHERE user_id = ? AND refresh_token_hash = ? AND is_active = TRUE',
        [userId, refreshTokenHash]
      );
      
      if (result.length === 0) {
        return null;
      }

      const mappedSessions = this.sessionMapper.dbToDomain(result[0]);
      return mappedSessions;

    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar la sesión is_active',
        {attemptedData:{userId:userId}, originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Consultar una sesión por refresh token hash
  async findByRefreshTokenHash(refreshTokenHash, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'SELECT * FROM sessions WHERE refresh_token_hash = ?',
        [refreshTokenHash]
      );

      if (result.length === 0) {
        return null; 
      }

      const mappedSession = this.sessionMapper.dbToDomain(result[0]);
      return mappedSession;
      
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

module.exports = SessionDAO;