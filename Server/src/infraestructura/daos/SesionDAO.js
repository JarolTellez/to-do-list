class SesionDAO {
  constructor(refreshTokenMapper, conexionBD) {
    this.refreshTokenMapper = refreshTokenMapper;
    this.conexionBD = conexionBD;
  }

  // Guardar una nueva sesión
  async guardarSesion(sesion) {
    const connection = await this.conexionBD.conectar();
    try {
      const [result] = await connection.query(
        "INSERT INTO sesiones (id_usuario, refresh_token_hash, id_dispositivo, user_agent, ip, fecha_creacion, fecha_expiracion, activo) VALUES (?,?,?,?,?,?,?,?)",
        [
          sesion.idUsuario,
          sesion.refreshTokenHash,
          sesion.idDispositivo,
          sesion.userAgent,
          sesion.ip,
          sesion.fechaCreacion,
          sesion.fechaExpiracion,
          sesion.activo
        ]
      );

      // Asignar el ID generado
      sesion.idRefreshToken = result.insertId;

      return sesion;
    } catch (error) {
      console.error(`Error al agregar el refresh token para usuario ${sesion.idUsuario}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Desactivar una sesión por ID de la sesion
  async desactivarSesionPorId(idSesion) {
    const connection = await this.conexionBD.conectar();
    try {
      const [result] = await connection.query(
        "UPDATE sesiones SET activo=FALSE WHERE id_sesion = ?",
        [idSesion]
      );
      console.log(`Sesión ${idSesion} desactivada. Filas afectadas: ${result.affectedRows}`);
    } catch (error) {
      console.error(`Error al desactivar la sesión ${idSesion}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Desactivar todas las sesiones de un usuario
  async desactivarTodasPorIdUsuario(idUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [result] = await connection.query(
        "UPDATE sesiones SET activo=FALSE WHERE id_usuario=?",
        [idUsuario]
      );
      console.log(`Todas las sesiones del usuario ${idUsuario} desactivadas. Filas afectadas: ${result.affectedRows}`);
    } catch (error) {
      console.error(`Error al desactivar las sesiones del usuario ${idUsuario}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async desactivarPorIdUsuarioIdDispositivo(idUsuario, idDispositivo) {
     const connection = await this.conexionBD.conectar();
    try {
      const [result] = await connection.query(
        "UPDATE sesiones SET activo = FALSE WHERE id_usuario = ? AND id_dispositivo = ?",
        [idUsuario, idDispositivo]
      );
      console.log(`La sesion del usuario ${idUsuario} con id de dispositivo ${idDispositivo} ha sido desactivada. Filas afectadas: ${result.affectedRows}`);
    } catch (error) {
      console.error(`Error al desactivar la sesione del usuario ${idUsuario} con id de dispositivo ${idDispositivo}}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
  async desactivarSesionMasAntigua(idUsuario) {
  const connection = await this.conexionBD.conectar();
  try {
    const [result] = await connection.query(`
      DELETE FROM sesiones 
      WHERE id_usuario = ? 
      ORDER BY fecha_creacion ASC 
      LIMIT 1
    `, [idUsuario]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al eliminar sesión más antigua:', error);
    throw error;
  } finally {
    connection.release();
  }
}

  // Consultar todas las sesiones de un usuario
  async consultarSesionesPorIdUsuario(idUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [sesiones] = await connection.query(
        "SELECT * FROM sesiones WHERE id_usuario = ?",
        [idUsuario]
      );
      return sesiones;
    } catch (error) {
      console.error(`Error al consultar sesiones del usuario ${idUsuario}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

    async consultarSesionesActivasPorIdUsuario(idUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [sesiones] = await connection.query(
        "SELECT * FROM sesiones WHERE id_usuario = ? AND activo = TRUE",
        [idUsuario]
      );
      return sesiones;
    } catch (error) {
      console.error(`Error al consultar sesiones del usuario ${idUsuario}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Consultar una sesión por refresh token hash
  async consultarSesionPorRefreshTokenHash(refreshTokenHash) {
    const connection = await this.conexionBD.conectar();
    try {
      const [sesion] = await connection.query(
        "SELECT * FROM sesiones WHERE refresh_token_hash = ?",
        [refreshTokenHash]
      );
      return sesion;
    } catch (error) {
      console.error(`Error al consultar sesión con refresh token hash ${refreshTokenHash}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = SesionDAO;
