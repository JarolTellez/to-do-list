const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class TareaEtiquetaDAO extends BaseDatabaseHandler {
   constructor(tareaEtiquetaMapper, conexionBD, DatabaseError, NotFoundError, ConflictError) {
    super(conexionBD);
    this.tareaEtiquetaMapper = tareaEtiquetaMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

   async agregarTareaEtiqueta(idTarea, idEtiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [nuevaTareaEtiqueta] = await connection.execute(
        "INSERT INTO tarea_etiqueta (id_tarea, id_etiqueta) VALUES (?, ?)",
        [idTarea, idEtiqueta]
      );
      const idTareaEtiqueta = nuevaTareaEtiqueta.insertId;
      return idTareaEtiqueta;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Esta tarea ya tiene asignada esta etiqueta',
          { idTarea, idEtiqueta }
        );
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW' || error.errno === 1452) {
        throw new this.ConflictError(
          'La tarea o etiqueta referenciada no existe',
          { idTarea, idEtiqueta }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo agregar la relación tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async actualizarTareaEtiqueta(tareaEtiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [resultado] = await connection.execute(
        "UPDATE tarea_etiqueta SET id_tarea = ?, id_etiqueta = ? WHERE id_tarea_etiqueta = ?",
        [
          tareaEtiqueta.idTarea,
          tareaEtiqueta.idEtiqueta,
          tareaEtiqueta.idTareaEtiqueta,
        ]
      );

      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError('La relación tarea-etiqueta no existe');
      }

      return tareaEtiqueta;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe esta combinación de tarea y etiqueta',
          { idTarea: tareaEtiqueta.idTarea, idEtiqueta: tareaEtiqueta.idEtiqueta }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo actualizar la relación tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async eliminarTareaEtiqueta(idTareaEtiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [resultado] = await connection.execute(
        "DELETE FROM tarea_etiqueta WHERE id_tarea_etiqueta = ?",
        [idTareaEtiqueta]
      );
      
      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError('La relación tarea-etiqueta no existe');
      }
      
      return resultado.affectedRows;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo eliminar la relación tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Elimina todas las relaciones de TareaEtiqueta por idTarea para eliminar todas las etiquetas de una tarea
   async eliminarTareaEtiquetasPorIdTarea(idTarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [resultado] = await connection.query(
        "DELETE FROM tarea_etiqueta WHERE id_tarea = ?",
        [idTarea]
      );

      return resultado.affectedRows;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo eliminar las relaciones tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async consultarTodasTareasEtiquetas(externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tareasEtiquetas] = await connection.query(
        "SELECT * FROM tarea_etiqueta"
      );
      return tareasEtiquetas;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar todas las relaciones tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async consultarTareaEtiquetaPorIdTarea(idTarea, externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tareasEtiquetas] = await connection.execute(
        "SELECT * FROM tarea_etiqueta WHERE id_tarea = ?",
        [idTarea]
      );
      return tareasEtiquetas;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las relaciones tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Método adicional útil: Consultar si existe una relación específica
  async existeRelacionTareaEtiqueta(idTarea, idEtiqueta, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [resultados] = await connection.execute(
        "SELECT * FROM tarea_etiqueta WHERE id_tarea = ? AND id_etiqueta = ?",
        [idTarea, idEtiqueta]
      );
      
      return resultados.length > 0;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo verificar la relación tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = TareaEtiquetaDAO;