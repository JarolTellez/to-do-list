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
        "INSERT INTO sesiones (id_usuario, refresh_token_hash, user_agent, ip, fecha_creacion, fecha_expiracion, activo) VALUES (?,?,?,?,?,?,?)",
        [
          sesion.idUsuario,
          sesion.refreshTokenHash,
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
