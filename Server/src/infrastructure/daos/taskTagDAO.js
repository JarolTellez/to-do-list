const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  DatabaseError,
  ConflictError,
  ValidationError,
} = require("../../utils/appErrors");

const {
  SORT_ORDER,
  TASK_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class TaskTagDAO extends BaseDatabaseHandler {
  constructor({ taskTagMapper, connectionDB }) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
  }

  async create( taskTag, externalConn = null ) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO task_tag (task_id, tag_id) VALUES (?, ?)",
        [taskTag.taskId, taskTag.tagId]
      );

      // obtener el registro
      const [rows] = await connection.execute(
        "SELECT * FROM task_tag WHERE id = ?",
        [result.insertId]
      );

      const insertedTaskTag = rows[0];
      const mappedTaskTag = this.taskTagMapper.dbToDomain(insertedTaskTag);
      return mappedTaskTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError(
          "Esta tarea ya tiene asignada esta etiqueta",
          { attemptedData: { taskId, tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw new this.ConflictError(
          "La tarea o etiqueta referenciada no existe",
          { attemptedData: { taskId, tagId } }
        );
      }

      throw new this.DatabaseError(
        "Error al crear la relacion taskTag en la base de datos",
        {
          attemptedData: { taskId, tagId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // eliminar una relacion taskTag por id
  async delete( id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskTagIdNum = Number(id);
      if (Number.isInteger(taskTagIdNum) || taskTagIdNum <= 0) {
        throw new ValidationError("Invalid task tag id");
      }

      const [result] = await connection.execute(
        "DELETE FROM task_tag WHERE id = ?",
        [taskTagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al eliminar la relación taskTag de la base de datos",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  //eliminar una relacion especifica por taskId y tagId
  async deleteByTaskIdAndTagId(taskId, tagId, externalConn = null ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      const tagIdNum = Number(tagId);

      if (Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      if (Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new ValidationError("Invalid tag id");
      }
      const [result] = connection.execute(
        `DELETE FROM tasg_tag WHERE task_id = ? AND tag_id =?`,
        [taskIdNum, tagIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new this.DatabaseError(
        "Error al eliminar la relación taskTag de la base de datos",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Elimina todas las relaciones de TareaEtiqueta por taskId para eliminar todas las etiquetas de una tarea
  async deleteByTaskId( taskId, externalConn = null ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskIdNum);

      if (Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      const [result] = await connection.execute(
        "DELETE FROM task_tag WHERE task_id = ?",
        [taskIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new this.DatabaseError(
        "Error al eliminar la relacion tarea-etiqueta de la base de datos",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findById( id, externalConn = null ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskTagIdNum = Number(id);

      if (!Number.isInteger(taskTagIdNum) || taskTagIdNum <= 0) {
        throw new ValidationError("Invalid task tag id");
      }

      const [rows] = await connection.execute(
        `SELECT 
         id AS  task_tag_id,
         task_id,
         tag_id,
         created_at AS task_tag_created_at
         FROM task_tag
        WHERE id = ?`,
        [taskTagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedTaskTag = this.taskTagMapper.dbToDomain(rows[0]);
      return mappedTaskTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar la etiqueta en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskTagId: taskTagIdNum },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findByTaskId(
    taskId,
    {
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC}={}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

       if (!Object.values(TASK_TAG_SORT_FIELD).includes(sortBy)) {
              throw new ValidationError(
                `Invalid sort field. Valid values: ${Object.values(
                  TASK_TAG_SORT_FIELD
                ).join(", ")}`
              );
            }
      
            if (!Object.values(SORT_ORDER).includes(sortOrder)) {
              throw new ValidationError(
                `Invalid sort order. Valid values: ${Object.values(SORT_ORDER).join(
                  ", "
                )}`
              );
            }

       const pageNum = Math.max(
              PAGINATION_CONFIG.DEFAULT_PAGE,
              parseInt(page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE
            );
            let limitNum = parseInt(limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;
      
            // Aplicar limite maximo
            limitNum = Math.min(limitNum, PAGINATION_CONFIG.MAX_LIMIT);
            // aplicar limite minimo
            limitNum = Math.max(1, limitNum); // asegurar que sea al menos 1
      
            const offset = (pageNum - 1) * limitNum;
      


      const [rows] = await connection.execute(
        `SELECT 
         id AS  task_tag_id,
         task_id,
         tag_id,
         created_at AS task_tag_created_at
         FROM task_tag
        WHERE task_id = ?`,
        [taskIdNum]
      );

      const mappedTaskTag = Array.isArray(rows)
        ? rows.map((row) => this.taskTagMapper.dbToDomain(row))
        : [];
      return mappedTaskTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar la task tag en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskTagId: taskTagIdNum },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findByTagId( tagId, externalConn = null ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = Number(tagId);

      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new ValidationError("Invalid tag id");
      }

      const [rows] = await connection.execute(
        `SELECT 
         id AS  task_tag_id,
         task_id,
         tag_id,
         created_at AS task_tag_created_at
         FROM task_tag
        WHERE tag_id = ?`,
        [tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedTaskTag = this.taskTagMapper.dbToDomain(rows[0]);
      return mappedTaskTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar la task tag en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskTagId: taskTagIdNum },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findByTaskId(taskId, tagId, externalConn = null ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      const tagIdNum = Number(tagId);

      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new ValidationError("Invalid tag id");
      }

      const [rows] = await connection.execute(
        `SELECT 
         id AS  task_tag_id,
         task_id,
         tag_id,
         created_at AS task_tag_created_at
         FROM task_tag
        WHERE task_id = ? AND tag_id = ?`,
        [taskIdNum, tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedTaskTag = this.taskTagMapper.dbToDomain(rows[0]);
      return mappedTaskTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar la task tag en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskTagId: taskTagIdNum },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = TaskTagDAO;
