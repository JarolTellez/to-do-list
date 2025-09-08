const BaseDatabaseHandler = require('../config/BaseDatabaseHandler');

class TaskTagDAO extends BaseDatabaseHandler {
   constructor({taskTagMapper, connectionDB, DatabaseError, ConflictError}) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
    this.DatabaseError = DatabaseError;
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
          { attemptedData:{taskId, tagId}}
        );
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW' || error.errno === 1452) {
        throw new this.ConflictError(
          'La tarea o etiqueta referenciada no existe',
          {attemptedData:{taskId, tagId}}
        );
      }
      
      throw new this.DatabaseError(
        'Error al crear la relacion taskTag en la base de datos',
        {attemptedData:{taskId, tagId},originalError: error.message, code: error.code }
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
      return taskTag;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe esta combinación de tarea y etiqueta',
          {attemptedData:{taskId: taskTag.taskId, tagId: taskTag.tagId}}
        );
      }
      
      throw new this.DatabaseError(
        'Error al actualizar la taskTag en la base de datos',
        {attemptedData:{taskId: taskTag.taskId, tagId: taskTag.tagId}, originalError: error.message, code: error.code }
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
      
    
      
      return result.affectedRows>0;
    } catch (error) {
      throw new this.DatabaseError(
        'Error al eliminar la relación taskTag de la base de datos',
        {attemptedData:{taskTagId: id}, originalError: error.message, code: error.code }
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
        'Error al eliminar la relacion tarea-etiqueta de la base de datos',
        {attemptedData:{taskTagId: id}, originalError: error.message, code: error.code }
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
        'Error al consultar todas las taskTags en la base de datos',
        {originalError: error.message, code: error.code }
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
        'Error al consultar la taskTag en la base de datos',
        { attemptedData:{taskId},originalError: error.message, code: error.code }
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
        'Error al consultar la taskTag en la base de datos',
        { attemptedData:{taskId, tagId},originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = TaskTagDAO;