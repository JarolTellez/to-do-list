class SesionDAO {
  constructor(sesionMapper, conexionBD) {
    this.sesionMapper = sesionMapper;
    this.conexionBD = conexionBD;
  }

  // Guardar una nueva sesión
  async guardarSesion(sesion) {
    const connection = await this.conexionBD.conectar();
    try {
      const [resultado] = await connection.query(
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

      // No mapeo porque ya llega al metodo como dominio
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
      const [resultado] = await connection.query(
        "UPDATE sesiones SET activa = FALSE WHERE id_sesion = ?",
        [idSesion]
      );
      console.log(`Sesión ${idSesion} desactivada. Filas afectadas: ${resultado.affectedRows}`);
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
      const [resultado] = await connection.query(
        "UPDATE sesiones SET activa=FALSE WHERE id_usuario=?",
        [idUsuario]
      );
      console.log(`Todas las sesiones del usuario ${idUsuario} desactivadas. Filas afectadas: ${resultado.affectedRows}`);
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
      const [resultado] = await connection.query(
        "UPDATE sesiones SET activa = FALSE WHERE id_usuario = ? AND id_dispositivo = ?",
        [idUsuario, idDispositivo]
      );
      console.log(`La sesion del usuario ${idUsuario} con id de dispositivo ${idDispositivo} ha sido desactivada. Filas afectadas: ${resultado.affectedRows}`);
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
    const [resultado] = await connection.query(`
      DELETE FROM sesiones 
      WHERE id_usuario = ? 
      ORDER BY fecha_creacion ASC 
      LIMIT 1
    `, [idUsuario]);

    return resultado.affectedRows > 0;
  } catch (error) {
    console.error('Error al eliminar sesión más antigua:', error);
    throw error;
  } finally {
    connection.release();
  }
}
// PONER MAPPERS DE BD A DOMINIO
  // Consultar todas las sesiones de un usuario
  async consultarSesionesPorIdUsuario(idUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [resultados] = await connection.query(
        "SELECT * FROM sesiones WHERE id_usuario = ?",
        [idUsuario]
      );
      const sesionesDominio = resultados.map(elemento=> this.sesionMapper.bdToDominio(elemento));
      return sesionesDominio;
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
      const [resultados] = await connection.query(
        "SELECT * FROM sesiones WHERE id_usuario = ? AND activa = TRUE",
        [idUsuario]
      );
      const sesionesDominio = resultados.map(elemento=> this.sesionMapper.bdToDominio(elemento));
      return sesionesDominio;
    } catch (error) {
      console.error(`Error al consultar sesiones del usuario ${idUsuario}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarSesionesActivasPorIdUsuarioRTHash(idUsuario, refreshTokenHash) {
    const connection = await this.conexionBD.conectar();
    try {
      const [resultados] = await connection.query(
        "SELECT * FROM sesiones WHERE id_usuario = ? AND refresh_token_hash =?  AND activa = TRUE",
        [idUsuario, refreshTokenHash]
      );
      const sesionesDominio = resultados.map(elemento=> this.sesionMapper.bdToDominio(elemento));
      return sesionesDominio;
    } catch (error) {
      console.error(`Error al consultar sesiones del usuario ${idUsuario} y refresh token Hash ${refreshTokenHash}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
  // Consultar una sesión por refresh token hash
  async consultarSesionPorRefreshTokenHash(refreshTokenHash) {
    const connection = await this.conexionBD.conectar();
    try {
      const [resultados] = await connection.query(
        "SELECT * FROM sesiones WHERE refresh_token_hash = ?",
        [refreshTokenHash]
      );

        if (resultados.length === 0) {
            return null; 
        }

      //Toma solo el primero porque el refreshTokenHash es unico
        const sesionBD = resultados[0];
        
       
        return this.sesionMapper.bdToDominio(sesionBD);
    } catch (error) {
      console.error(`Error al consultar sesión con refresh token hash ${refreshTokenHash}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = SesionDAO;
