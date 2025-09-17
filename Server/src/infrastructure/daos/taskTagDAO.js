const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  DatabaseError,
  ConflictError,
  ValidationError,
} = require("../../utils/appErrors");

const {
  validateSortField,
  validateSortOrder,
} = require("../utils/validation/sortValidator");
const {
  calculatePagination,
  calculateTotalPages,
  buildPaginationResponse,
} = require("../utils/pagination");

const {
  SORT_ORDER,
  TASK_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class TaskTagDAO extends BaseDatabaseHandler {
  constructor({ taskTagMapper, connectionDB }) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
  }

  async create(taskTag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO task_tag (task_id, tag_id) VALUES (?, ?)",
        [taskTag.taskId, taskTag.tagId]
      );

      const actualTaskTag = this.findById(result.insertId);
      return actualTaskTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError(
          "This task already has this tag assigned",
          { attemptedData: { taskId, tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw new this.ConflictError("the task or tag does not exist", {
          attemptedData: { taskId, tagId },
        });
      }

      throw new this.DatabaseError("Failed to create taskTag relationShip", {
        attemptedData: { taskId, tagId },
        originalError: error.message,
        code: error.code,
        context: "taskTag DAO - create method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }


  async delete(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskTagIdNum = Number(id);

      if (!Number.isInteger(taskTagIdNum) || taskTagIdNum <= 0) {
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

      throw new this.DatabaseError("Failed to delete taskTag relationship", {
        attemptedData: { taskTagId: id },
        originalError: error.message,
        code: error.code,
        context: "taskTag DAO - delete by id method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //eliminar una relacion especifica por taskId y tagId
  async deleteByTaskIdAndTagId(taskId, tagId, externalConn = null) {
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
      throw new this.DatabaseError("Failed to delete taskTag relationship", {
        attemptedData: { taskTagId: id },
        originalError: error.message,
        code: error.code,
        context: "taskTagDAO - delete by taskId and userId",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  // Elimina todas las relaciones de TareaEtiqueta por taskId para eliminar todas las etiquetas de una tarea
  async deleteAllByTaskId(taskId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);

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
        "Failed to delete all taskTag relationship for the specific task",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO - bulk deletion by taskId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findById(id, externalConn = null) {
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

      throw new DatabaseError("Failed to retrieve taskTag relationShip by id", {
        originalError: error.message,
        code: error.code,
        attemptedData: { taskTagId: taskTagIdNum },
        context: "taskTagDAO - find by id",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByTaskId(
    taskId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      const { safeField } = validateSortField(
        sortBy,
        TASK_TAG_SORT_FIELD,
        "TASK_TAG",
        "task tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de task_tags del task
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
       FROM task_tag tt 
       WHERE tt.task_id = ?`,
        [taskIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "task_tags"
        );
      }

      // CONSULTA 2: Obtener IDs de task_tags paginados
      const [taskTagIdsResult] = await connection.query(
        `SELECT tt.id
       FROM task_tag tt 
       WHERE tt.task_id = ?
       ORDER BY ${safeField} ${safeOrder}, tt.id ASC
       LIMIT ? OFFSET ?`,
        [taskIdNum, pagination.limit, pagination.offset]
      );

      if (taskTagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "task_tags"
        );
      }

      const taskTagIds = taskTagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los task_tags paginados
      const [rows] = await connection.query(
        `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
       WHERE tt.id IN (?)
       ORDER BY FIELD(tt.id, ${taskTagIds.map((_, index) => "?").join(",")})`,
        [taskTagIds, ...taskTagIds]
      );

      const mappedTaskTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.taskTagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedTaskTags,
        pagination,
        total,
        totalPages,
        "task_tags"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Failed to retrieve all taskTag for specific task",
        {
          attemptedData: {
            taskId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO - find all by taskId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByTaskIdAndUserId(
    taskId,
    userId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      const userIdNum = Number(userId);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }
      const [task] = await connection.execute(
        `SELECT t.id FROM tasks t WHERE t.id = ? AND t.user_id = ?`,
        [taskIdNum, userIdNum]
      );

      if (task.length === 0) {
        throw new this.NotFoundError("Task not found or not owned by user");
      }

      const { safeField } = validateSortField(
        sortBy,
        TASK_TAG_SORT_FIELD,
        "TASK_TAG",
        "task tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de task_tags del task PARA ESTE USUARIO
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
         FROM task_tag tt 
         WHERE tt.task_id = ?`,
        [taskIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "task_tags"
        );
      }

      // CONSULTA 2: Obtener IDs de task_tags paginados
      const [taskTagIdsResult] = await connection.query(
        `SELECT tt.id
         FROM task_tag tt 
         WHERE tt.task_id = ?
         ORDER BY ${safeField} ${safeOrder}, tt.id ASC
         LIMIT ? OFFSET ?`,
        [taskIdNum, pagination.limit, pagination.offset]
      );

      if (taskTagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "task_tags"
        );
      }

      const taskTagIds = taskTagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los task_tags paginados
      const [rows] = await connection.query(
        `SELECT 
           tt.id AS task_tag_id,
           tt.task_id,
           tt.tag_id,
           tt.created_at AS task_tag_created_at
         FROM task_tag tt 
         WHERE tt.id IN (?)
         ORDER BY FIELD(tt.id, ${taskTagIds.map((_, index) => "?").join(",")})`,
        [taskTagIds, ...taskTagIds]
      );

      const mappedTaskTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.taskTagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedTaskTags,
        pagination,
        total,
        totalPages,
        "task_tags"
      );
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof this.NotFoundError
      ) {
        throw error;
      }

      throw new this.DatabaseError(
        "Failed to retrieve all taskTags for specific task and user",
        {
          attemptedData: {
            taskId,
            userId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO - find all by taskId and userId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByTagId(
    tagId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = Number(tagId);
      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new ValidationError("Invalid tag id");
      }

      const { safeField } = validateSortField(
        sortBy,
        TASK_TAG_SORT_FIELD,
        "TASK_TAG",
        "task tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de task_tags del tag
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
       FROM task_tag tt 
       WHERE tt.tag_id = ?`,
        [tagIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "task_tags"
        );
      }

      // CONSULTA 2: Obtener IDs de task_tags paginados
      const [taskTagIdsResult] = await connection.query(
        `SELECT tt.id
       FROM task_tag tt 
       WHERE tt.tag_id = ?
       ORDER BY ${safeField} ${safeOrder}, tt.id ASC
       LIMIT ? OFFSET ?`,
        [tagIdNum, pagination.limit, pagination.offset]
      );

      if (taskTagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "task_tags"
        );
      }

      const taskTagIds = taskTagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los task_tags paginados
      const [rows] = await connection.query(
        `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
       WHERE tt.id IN (?)
       ORDER BY FIELD(tt.id, ${taskTagIds.map((_, index) => "?").join(",")})`,
        [taskTagIds, ...taskTagIds]
      );

      const mappedTaskTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.taskTagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedTaskTags,
        pagination,
        total,
        totalPages,
        "task_tags"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new this.DatabaseError(
        "Failed to retrieve all taskTag for specific tag",
        {
          attemptedData: {
            tagId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO - find all by tagId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findByTaskIdAndTagId(taskId, tagId, externalConn = null) {
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
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
       WHERE tt.task_id = ? AND tt.tag_id = ?`,
        [taskIdNum, tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.taskTagMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in TaskTagDAO.findByTaskIdAndTagId:", {
        taskId,
        tagId,
        error: error.message,
      });

      throw new this.DatabaseError("Failed to retrieve specific taskTag ", {
        attemptedData: {
          taskId,
          tagId,
        },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        context: "taskTagDAO - find by taskId and tagId",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = TaskTagDAO;
