const BaseDatabaseHandler = require('../config/BaseDatabaseHandler');

class TaskTagDAO extends BaseDatabaseHandler {
   constructor({taskTagMapper, connectionDB, DatabaseError, NotFoundError, ConflictError}) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

   async create(taskId, tagId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [taskTagResponse] = await connection.execute(
        'INSERT INTO task_tag (task_id, tag_id) VALUES (?, ?)',
        [taskId, tagId]
      );
      const id = taskTagResponse.insertId;
      return id;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Esta tarea ya tiene asignada esta etiqueta',
          { taskId, tagId }
        );
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW' || error.errno === 1452) {
        throw new this.ConflictError(
          'La tarea o etiqueta referenciada no existe',
          { taskId, tagId }
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

   async update(taskTag, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'UPDATE task_tag SET task_id = ?, tag_id = ? WHERE id = ?',
        [
          taskTag.taskId,
          taskTag.tagId,
          taskTag.id,
        ]
      );

      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La relación tarea-etiqueta no existe');
      }

      return taskTag;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe esta combinación de tarea y etiqueta',
          { taskId: taskTag.taskId, tagId: taskTag.tagId }
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

   async delete(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'DELETE FROM task_tag WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La relación tarea-etiqueta no existe');
      }
      
      return result.affectedRows;
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

  // Elimina todas las relaciones de TareaEtiqueta por taskId para eliminar todas las etiquetas de una tarea
   async deleteByTaskId(taskId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.query(
        'DELETE FROM task_tag WHERE task_id = ?',
        [taskId]
      );

      return result.affectedRows;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo eliminar las relaciones tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findAll(externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.query(
        'SELECT * FROM task_tag'
      );
      return rows;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar todas las relaciones tarea-etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findByTaskId(taskId, externalConn = null) {
    const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM task_tag WHERE task_id = ?',
        [taskId]
      );
      return rows;
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
  async findByTaskIdAndTagId(taskId, tagId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM task_tag WHERE task_id = ? AND tag_id = ?',
        [taskId, tagId]
      );
      
      return rows.length > 0;
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

module.exports = TaskTagDAO;