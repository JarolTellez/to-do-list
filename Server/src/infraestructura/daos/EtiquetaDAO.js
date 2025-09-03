const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class EtiquetaDAO extends BaseDatabaseHandler {
   constructor({etiquetaMapper, conexionBD, DatabaseError, NotFoundError, ConflictError}) {
    super(conexionBD);
    this.etiquetaMapper = etiquetaMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

   async agregarEtiqueta(etiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO etiquetas (nombre, id_usuario) VALUES(?, ?)",
        [etiqueta.nombreEtiqueta, etiqueta.idUsuario]
      );

      etiqueta.idEtiqueta = result.insertId;
      return etiqueta;
    } catch (error) {
      // Error específico para duplicados
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe una etiqueta con ese nombre para este usuario',
          { nombre: etiqueta.nombreEtiqueta, idUsuario: etiqueta.idUsuario }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo guardar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async actualizarEtiqueta(etiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "UPDATE etiquetas SET nombre = ? WHERE id_etiqueta = ?", 
        [etiqueta.nombre, etiqueta.idEtiqueta]
      );
      
      // Verificar si se actualizó algún registro
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La etiqueta no existe');
      }
      
      return etiqueta;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      // Error de duplicado al actualizar
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError('Ya existe una etiqueta con ese nombre');
      }
      
      throw new this.DatabaseError(
        'No se pudo actualizar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
     await this.releaseConnection(connection, isExternal);
    }
  }

   async eliminarEtiqueta(idEtiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "DELETE FROM etiquetas WHERE id_etiqueta = ?", 
        [idEtiqueta]
      );
      
      // Verificar si se eliminó algún registro
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La etiqueta no existe');
      }
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      // Manejar error de clave foránea
      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar la etiqueta porque está siendo utilizada',
          { idEtiqueta }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo eliminar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async consultarTodasEtiquetas(externalConn = null) {
   const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [etiquetas] = await connection.query("SELECT * FROM etiquetas");
      return etiquetas;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar todas las etiquetas',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async consultarEtiquetaPorNombreIdUsuario(nombreEtiqueta, idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [etiqueta] = await connection.query(
        "SELECT * FROM etiquetas WHERE nombre = ? AND id_usuario = ?",
        [nombreEtiqueta, idUsuario]
      );
      
      return etiqueta[0];
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async consultarEtiquetasPorId(idEtiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [etiqueta] = await connection.execute(
        "SELECT * FROM etiquetas WHERE id_etiqueta = ?",
        [idEtiqueta]
      );
      
      if (!etiqueta[0]) {
        throw new this.NotFoundError('Etiqueta no encontrada');
      }
      
      return etiqueta[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo consultar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async consultarEtiquetasPorIdUsuario(idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [etiquetas] = await connection.query(
        "SELECT * FROM etiquetas WHERE id_usuario = ?",
        [idUsuario]
      );
      
      const tareasMapeadas = etiquetas.map(etiqueta => this.etiquetaMapper.bdToDominio(etiqueta));
      return tareasMapeadas;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las etiquetas del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = EtiquetaDAO;