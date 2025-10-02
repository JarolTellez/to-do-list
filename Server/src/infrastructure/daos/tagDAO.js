// const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

// const { SORT_ORDER, TAG_SORT_FIELD } = require("../constants/sortConstants");
// const { MAPPER_TYPES } = require("../constants/mapperConstants");

// class TagDAO extends BaseDatabaseHandler {
//   constructor({ tagMapper, connectionDB, errorFactory, inputValidator }) {
//     super(connectionDB, inputValidator, errorFactory);
//     this.tagMapper = tagMapper;
//     this.errorFactory = errorFactory;
//     this.inputValidator = inputValidator;
//   }

//   /**
//    * Creates a new tag in the database
//    * @param {Tag} tag  - Tag domain entity to persist
//    * @param {string} tag.name - Tag name (required)
//    * @param {number} tag.userId - Id of the user associated with the task
//    * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
//    * @returns {Promise<Task>} Persisted tag domain entity with assigned ID and timestamps.
//    * @throws {DatabaseError} On database operation failure.
//    * @throws {ConflictError} On duplicate tag name error
//    * @throws {ValidationError} If required fields are missing or invalid.
//    */
//   async create(tag, externalConn = null) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const [result] = await connection.execute(
//         "INSERT INTO tags (name) VALUES(?)",
//         [tag.name]
//       );
//       const insertedId = result.insertId;

//       // Find the complete created tag with generated Id and timestamps
//       const createdTag = await this.findById(insertedId, connection);

//       return createdTag;
//     } catch (error) {
//       // Duplicated error
//       if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
//         throw this.errorFactory.createConflictError(
//           "A tag with this name already exists for this user ",
//           { name: tag.name, userId: tag.userId }
//         );
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError("Failed to create tag", {
//         originalError: error.message,
//         code: error.code,
//         attemptedData: { name: tag.name, userId: tag.userId },
//         context: "tagDAO.create",
//       });
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Updates an existing tag in the database
//    * @param {Tag} tag  - Tag domain entity to update
//    * @param {string} tag.name - new tag name (required)
//    * @param {number} tag.id - Id of the tag to update
//    * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
//    * @returns {Promise<Task>} Persisted tag domain entity with assigned ID and timestamps.
//    * @throws {DatabaseError} On database operation failure.
//    * @throws {ConflictError} On duplicate tag name error
//    * @throws {ValidationError} If required fields are missing or invalid.
//    */
//   async update(tag, externalConn = null) {
//     const { connection, isExternal } = await this.getConnection(externalConn);
//     try {
//       const [result] = await connection.execute(
//         "UPDATE tags SET name = ? WHERE id = ?",
//         [tag.name, tag.id]
//       );
//       if (result.affectedRows === 0) {
//         return null;
//       }
//       // Find the complete updated tag
//       const updatedTag = await this.findById(insertedId, connection);

//       return updatedTag;
//     } catch (error) {
//       // Handle duplicate entry errrors
//       if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
//         throw this.errorFactory.createConflictError(
//           "Already exist a tag with this name",
//           {
//             attemptedData: { tagName: tag.name },
//           }
//         );
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError("Failed to update tag", {
//         originalError: error.message,
//         code: error.code,
//         attemptedData: { tagId: tag.id, tagName: tag.name },
//         context: "tagDAO.update",
//       });
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Deletes an existing tag in the database by their id
//    * @param {number} id - The id of the tag to delete (required and unique)
//    * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
//    * @returns {Promise<Boolean>} True if the tag was successfully deleted, false if the tag didn't exist.
//    * @throws {DatabaseError} On database operation failure.
//    * @throws {ConflictError} when tag has associated data in other tables
//    * @throws {ValidationError} If required fields are missing or invalid.
//    */
//   async delete(id, externalConn = null) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const tagIdNum = this.inputValidator.validateId(id, "tag id");
//       const [result] = await connection.execute(
//         "DELETE FROM tags WHERE id = ?",
//         [tagIdNum]
//       );

//       return result.affectedRows > 0;
//     } catch (error) {
//       // Handle associated data in other tables
//       if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
//         throw this.errorFactory.createConflictError(
//           "Cannot delete the tag because it is currently in use",
//           { attemptedData: { tagId: id } }
//         );
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError("Failed to delete tag", {
//         attemptedData: { tagId: id },
//         originalError: error.message,
//         code: error.code,
//         context: "tagDAO.delete",
//       });
//     } finally {
//       if (connection && !isExternal) {
//         // Release only internal connection (external is managed by caller)
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Retrieve a tag from the database by their id.
//    * @param {number} id - The id of the tag to retrieve (require and unique)
//    * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
//    * @returns {Promise<Tag>} Tag domain entity if was found, null if the tag didn't exist.
//    * @throws {DatabaseError} On database operation failure.
//    * @throws {ValidationError} If required fields are missing or invalid.
//    */
//   async findById(id, externalConn = null) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);
//     try {
//       const tagIdNum = this.inputValidator.validateId(id, "tag id");

//       const baseQuery = `SELECT
//        id AS tag_id,
//        name AS tag_name,
//        description AS tag_description,
//        created_at AS tag_created_at
//        FROM tags WHERE id = ?`;

//       const result = await this._executeQuery({
//         connection,
//         baseQuery,
//         params: [tagIdNum],
//         mapper: this.tagMapper.dbToDomain,
//       });

//       return result.length > 0 ? result[0] : null;
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to retrieve tag by id",
//         {
//           originalError: error.message,
//           code: error.code,
//           attemptedData: { tagId: tagIdNum },
//           context: "tagDAO.findById",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Retrieve a tag from the database by their name.
//    * @param {string} name - The name of the tag to retrieve (require and unique)
//    * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
//    * @returns {Promise<Tag>} Tag domain entity if was found, null if the tag didn't exist.
//    * @throws {DatabaseError} On database operation failure.
//    * @throws {ValidationError} If required fields are missing or invalid.
//    */
//   async findByName(name, externalConn = null) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);
//     try {
//       if (!name || typeof name !== "string") {
//         throw this.errorFactory.createValidationError("Invalid tag name");
//       }

//       const baseQuery = `SELECT
//        id AS tag_id,
//        name AS tag_name,
//        description AS tag_description,
//        created_at AS tag_created_at
//        FROM tags WHERE name = ?`;

//       const result = await this._executeQuery({
//         connection,
//         baseQuery,
//         params: [name],
//         mapper: this.tagMapper.dbToDomain,
//       });

//       return result.length > 0 ? result[0] : null;
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to retrieve tag by name",
//         {
//           attemptedData: { name },
//           originalError: error.message,
//           code: error.code,
//           context: "tagDAO.findByName",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Retrieves all tags from the database with optional pagination, sorting, and filtering.
//    * @param {Object} [options={}] - Configuration options for the query.
//    * @param {object} [options.externalConn=null] - External database connection for transaction support.
//    * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
//    * @param {number} [options.offset=null] - Number of records to skip for pagination.
//    * @param {string} [options.sortBy=TAG_SORT_FIELD.CREATED_AT] - Field to sort results by.
//    * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
//    * @returns {Promise<Array>} Array of Tag domain entity.
//    * @throws {ValidationError} If invalid sorting parameters are provided.
//    * @throws {DatabaseError} If database operation fails.
//    */
//   async findAll({
//     externalConn = null,
//     sortBy = TAG_SORT_FIELD.CREATED_AT,
//     sortOrder = SORT_ORDER.DESC,
//     limit = null,
//     offset = null,
//   } = {}) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const baseQuery = `SELECT
//        id AS tag_id,
//        name AS tag_name,
//        description AS tag_description,
//        created_at AS tag_created_at
//        FROM tags`;

//       return await this._executeQuery({
//         connection,
//         baseQuery,
//         sortBy,
//         sortOrder,
//         sortConstants: TAG_SORT_FIELD,
//         entityType: "TAG",
//         entityName: "tag",
//         limit,
//         offset,
//         mapper: this.tagMapper.dbToDomain,
//       });
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to retrieve all tags",
//         {
//           attemptedData: {
//             sortBy,
//             sortOrder,
//             limit,
//             offset,
//           },
//           originalError: error.message,
//           code: error.code,
//           stack: error.stack,
//           context: "tagDAO.findAll",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }
//   //Metodos compuestos
//   /**
//    * Retrieves all tags from the database by associated userId with optional pagination, sorting, and filtering.
//    * @param {Object} [options={}] - Configuration options for the query.
//    * @param {number} [options.userId] -The userId associated to the tags to retrieve.
//    * @param {object} [options.externalConn=null] - External database connection for transaction support.
//    * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
//    * @param {number} [options.offset=null] - Number of records to skip for pagination.
//    * @param {string} [options.sortBy=TAG_SORT_FIELD.CREATED_AT] - Field to sort results by.
//    * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
//    * @returns {Promise<Array>} Array of Tag domain entity.
//    * @throws {ValidationError} If invalid sorting parameters are provided.
//    * @throws {DatabaseError} If database operation fails.
//    */
//   async findAllByUserId({
//     userId,
//     externalConn = null,
//     sortBy = TAG_SORT_FIELD.CREATED_AT,
//     sortOrder = SORT_ORDER.DESC,
//     limit = null,
//     offset = null,
//   } = {}) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const userIdNum = this.inputValidator.validateId(userId, "user id");

//       const baseQuery = `
//       SELECT
//         t.id AS tag_id,
//         t.name AS tag_name,
//         t.description AS tag_description,
//         t.created_at AS tag_created_at
//       FROM tags t
//       INNER JOIN user_tag ut ON t.id = ut.tag_id
//       WHERE ut.user_id = ?`;

//       return await this._executeQuery({
//         connection,
//         baseQuery,
//         params: [userIdNum],
//         sortBy,
//         sortOrder,
//         sortConstants: TAG_SORT_FIELD,
//         entityType: "TAG",
//         entityName: "tag",
//         limit,
//         offset,
//         mapper: this.tagMapper.dbToDomain,
//       });
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to retrieve tags by user id",
//         {
//           attemptedData: {
//             userId,
//             sortBy,
//             sortOrder,
//             limit,
//             offset,
//           },
//           originalError: error.message,
//           code: error.code,
//           stack: error.stack,
//           context: "tagDAO.findAllByUserId",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Retrieves all tags from the database by their associated taskId with optional pagination, sorting, and filtering.
//    * @param {Object} [options={}] - Configuration options for the query.
//    * @param {number} [options.taskId] -The taskId associated to the tags to retrieve.
//    * @param {object} [options.externalConn=null] - External database connection for transaction support.
//    * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
//    * @param {number} [options.offset=null] - Number of records to skip for pagination.
//    * @param {string} [options.sortBy=TAG_SORT_FIELD.CREATED_AT] - Field to sort results by.
//    * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
//    * @returns {Promise<Array>} Array of Tag domain entity.
//    * @throws {ValidationError} If invalid sorting parameters are provided.
//    * @throws {DatabaseError} If database operation fails.
//    */
//   async findAllByTaskId({
//     taskId,
//     externalConn = null,
//     sortBy = TAG_SORT_FIELD.CREATED_AT,
//     sortOrder = SORT_ORDER.DESC,
//     limit = null,
//     offset = null,
//   } = {}) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const taskIdNum = this.inputValidator.validateId(taskId, "task id");

//       const baseQuery = `
//       SELECT
//         t.id AS tag_id,
//         t.name AS tag_name,
//         t.description AS tag_description,
//         t.created_at AS tag_created_at
//       FROM tags t
//       INNER JOIN task_tag tt ON t.id = tt.tag_id
//       WHERE tt.task_id = ?`;

//       return await this._executeQuery({
//         connection,
//         baseQuery,
//         params: [taskIdNum],
//         sortBy,
//         sortOrder,
//         sortConstants: TAG_SORT_FIELD,
//         entityType: "TAG",
//         entityName: "tag",
//         limit,
//         offset,
//         mapper: this.tagMapper.dbToDomain,
//       });
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }

//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to retrieve tags by task id",
//         {
//           attemptedData: {
//             taskId,
//             sortBy,
//             sortOrder,
//             limit,
//             offset,
//           },
//           originalError: error.message,
//           code: error.code,
//           stack: error.stack,
//           context: "tagDAO.findAllByTaskId",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Count all tags from database
//    * @param {object} [options.externalConn=null] - External database connection for transaction support.
//    * @returns {Promise<number>} Total number of tags
//    * @throws {DatabaseError} If database operation fails
//    */
//   async countAll(externalConn = null) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const baseQuery = `SELECT COUNT(*) AS total FROM tags`;

//       const result = await this._executeQuery({
//         connection,
//         baseQuery,
//       });
//       return Number(result[0]?.total) || 0;
//     } catch (error) {
//       // Handle all database errors
//       throw this.errorFactory.createDatabaseError("Failed to count all tags", {
//         originalError: error.message,
//         code: error.code,
//         stack: error.stack,
//         context: "tagDAO.countAll",
//       });
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }
//   /**
//    * Count all tags from database by their associated userId
//    * @param {object} [options.externalConn=null] - External database connection for transaction support.
//    * @returns {Promise<number>} Total number of tags matching.
//    * @throws {DatabaseError} If database operation fails
//    * @throws {ValidationError} If invalid sorting parameters are provided.
//    */
//   async countAllByUserId({ userId, externalConn = null } = {}) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const userIdNum = this.inputValidator.validateId(userId, "user id");

//       const baseQuery = `SELECT COUNT(*) AS total
//         FROM tags t
//         INNER JOIN user_tag ut ON t.id = ut.tag_id
//         WHERE ut.user_id = ?`;

//       const result = await this._executeQuery({
//         connection,
//         baseQuery,
//         params: [userIdNum],
//       });

//       return Number(result[0]?.total) || 0;
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }
//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to count tags by user id",
//         {
//           attemptedData: { userId },
//           originalError: error.message,
//           code: error.code,
//           stack: error.stack,
//           context: "tagDAO.countAllByUserId",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   /**
//    * Count all tags from database by their associated taskId
//    * @param {object} [options.externalConn=null] - External database connection for transaction support.
//    * @returns {Promise<number>} Total number of tags matching.
//    * @throws {DatabaseError} If database operation fails
//    * @throws {ValidationError} If invalid sorting parameters are provided.
//    */
//   async countAllByTaskId({ taskId, externalConn = null } = {}) {
//     // Get database connection (new or provided external for transactions)
//     const { connection, isExternal } = await this.getConnection(externalConn);

//     try {
//       const taskIdNum = this.inputValidator.validateId(taskId, "task id");

//       const baseQuery = `SELECT COUNT(*) AS total
//         FROM tags t
//         INNER JOIN task_tag tt ON t.id = tt.tag_id
//         WHERE tt.task_id = ?`;

//       const result = await this._executeQuery({
//         connection,
//         baseQuery,
//         params: [taskIdNum],
//       });

//       return Number(result[0]?.total) || 0;
//     } catch (error) {
//       // Re-throw ValidationErrors (input issues)
//       if (error instanceof this.errorFactory.Errors.ValidationError) {
//         throw error;
//       }

//       // Handle all other database errors
//       throw this.errorFactory.createDatabaseError(
//         "Failed to count tags by task id",
//         {
//           attemptedData: { taskId },
//           originalError: error.message,
//           code: error.code,
//           stack: error.stack,
//           context: "tagDAO.countAllByTaskId",
//         }
//       );
//     } finally {
//       // Release only internal connection (external is managed by caller)
//       if (connection && !isExternal) {
//         await this.releaseConnection(connection, isExternal);
//       }
//     }
//   }

//   // async _executeTagQuery({
//   //   connection,
//   //   baseQuery,
//   //   params = [],
//   //   sortBy = TAG_SORT_FIELD.CREATED_AT,
//   //   sortOrder = SORT_ORDER.DESC,

//   // }) {
//   //   const { safeField } = this.inputValidator.validateSortField(
//   //     sortBy,
//   //     TAG_SORT_FIELD,
//   //     "TAG",
//   //     "tag sort field"
//   //   );
//   //   const { safeOrder } = this.inputValidator.validateSortOrder(
//   //     sortOrder,
//   //     SORT_ORDER
//   //   );

//   //   let query = `${baseQuery} ORDER BY ${safeField} ${safeOrder}`;
//   //   const queryParams = [...params];
//   //   if (limit !== null) query += " LIMIT ?";
//   //   if (offset !== null) query += " OFFSET ?";
//   //   if (limit !== null) queryParams.push(limit);
//   //   if (offset !== null) queryParams.push(offset);

//   //   const [rows] = await connection.query(query, queryParams);

//   //   return Array.isArray(rows) && rows.length > 0
//   //     ? rows.map((row) => this.tagMapper.dbToDomain(row))
//   //     : [];
//   // }
// }

// module.exports = TagDAO;

const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { TAG_SORT_FIELD } = require("../constants/sortConstants");

class TagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.tagMapper = tagMapper;
  }

  async create(tag, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const createdTag = await dbClient.tag.create({
          data: {
            name: tag.name,
            description: tag.description,
          },
        });

        return this.tagMapper.dbToDomain(createdTag);
      } catch (error) {
        if (error.code === "P2002") {
          throw this.errorFactory.createConflictError(
            "A tag with this name already exists",
            { name: tag.name }
          );
        }
        this._handlePrismaError(error, "tagDAO.create", { name: tag.name });
      }
    }, externalDbClient);
  }

  async findByName(name, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (!name || typeof name !== "string") {
          throw this.errorFactory.createValidationError("Invalid tag name");
        }

        const tag = await dbClient.tag.findUnique({
          where: { name: name.trim() },
        });

        return tag ? this.tagMapper.dbToDomain(tag) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "tagDAO.findByName", { name });
      }
    }, externalDbClient);
  }

  async findAllByUserId({
    userId,
    externalDbClient = null,
    limit = null,
    offset = null,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = "desc",
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const sortOptions = this._buildSortOptions(
        sortBy,
        sortOrder,
        TAG_SORT_FIELD
      );
      const paginationOptions = this._buildPaginationOptions(limit, offset);

      const tags = await dbClient.tag.findMany({
        where: {
          userTags: {
            some: {
              userId: userIdNum,
            },
          },
        },
        ...sortOptions,
        ...paginationOptions,
      });

      return tags.map((tag) => this.tagMapper.dbToDomain(tag));
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      this._handlePrismaError(error, "tagDAO.findAllByUserId", {
        userId,
        limit,
        offset,
      });
    }
       }, externalDbClient);
  }
}

module.exports = TagDAO;
