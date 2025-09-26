const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const {
  SORT_ORDER,
  USER_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class UserTagDAO extends BaseDatabaseHandler {
  constructor({ userTagMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB, inputValidator, errorFactory);
    this.userTagMapper = userTagMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  /**
   * Creates a new user-tag relationship in the database
   * @param {UserTag} userTag - UserTag domain entity to persist
   * @param {number} userTag.userId - Id of the user to associate
   * @param {number} userTag.tagId - Id of the tag to associate
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<UserTag>} Persisted UserTag entity with assigned Id and timestamps
   * @throws {ConflictError} When the user-tag relationship already exists or referenced entities don't exist
   * @throws {ValidationError} If input validation fails
   * @throws {DatabaseError} On database operation failure
   */
  async create(userTag, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { userId, tagId } = userTag;

      const userIdNum = this.inputValidator.validateId(userId, "user id");
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [result] = await connection.execute(
        `INSERT INTO user_tag (user_id, tag_id) VALUES(?,?)`,
        [userIdNum, tagIdNum]
      );

      const actualUserTag = await this.findByIdAndUserId(
        result.insertId,
        userIdNum,
        connection
      );

      return actualUserTag;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "This user already has this tag assigned",
          { attemptedData: { userId: userTag.userId, tagId: userTag.tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw this.errorFactory.createConflictError(
          "The referenced user or tag does not exist",
          { attemptedData: { userId: userTag.userId, tagId: userTag.tagId } }
        );
      }
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to create user-tag relationship",
        {
          attemptedData: { userId: userTag.userId, tagId: userTag.tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.create",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes a user-tag relationship by its Id
   * @param {number} id - Id of the user-tag relationship to delete
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if the relationship was found and deleted, false otherwise
   * @throws {ValidationError} If the user-tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async delete(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const idNum = this.inputValidator.validateId(id, "userTag id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE id = ? ",
        [idNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to delete user-tag relationship",
        {
          attemptedData: { userTagId: idNum },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.delete",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes a user-tag relationship by Id and user Id (ensures ownership)
   * @param {number} id - Id of the user-tag relationship to delete
   * @param {number} userId - Id of the user who owns the relationship
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if the relationship was found and deleted, false otherwise
   * @throws {ValidationError} If the user-tag Id or user Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deleteByIdAndUserId(id, userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const idNum = this.inputValidator.validateId(id, "userTag id");
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE id = ? AND user_id = ?",
        [idNum, userIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to delete user-tag relationship",
        {
          attemptedData: { id, userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.deleteByIdAndUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes a specific user-tag relationship by user Id and tag Id
   * @param {number} userId - Id of the user
   * @param {number} tagId - Id of the tag
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if the relationship was found and deleted, false otherwise
   * @throws {ValidationError} If the user Id or tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deleteByUserIdAndTagId(userId, tagId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE user_id = ? AND tag_id = ?",
        [userIdNum, tagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to delete user-tag relationship",
        {
          attemptedData: { userId, tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDao.deleteByUserIdAndTagId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes all user-tag relationships for a specific user
   * @param {number} userId - Id of the user whose tags will be removed
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if any relationships were deleted, false otherwise
   * @throws {ValidationError} If the user Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deleteAllByUserId(userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE user_id = ?",
        [userIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to delete al user-tag relationship for the specific user",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.deleteAllByUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes all user-tag relationships for a specific tag
   * @param {number} tagId - Id of the tag whose user associations will be removed
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if any relationships were deleted, false otherwise
   * @throws {ValidationError} If the tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deleteAllByTagId(tagId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE tag_id = ?",
        [tagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to delete all user-tag relationships for the specified tag",
        {
          attemptedData: { tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.deleteAllByTagId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Finds a user-tag relationship by its Id and user Id (ensures ownership)
   * @param {number} id - Id of the user-tag relationship to find
   * @param {number} userId - Id of the user who owns the relationship
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<UserTag|null>} UserTag entity if found, null otherwise
   * @throws {ValidationError} If the user-tag Id or user Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByIdAndUserId(id, userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userTagIdNum = this.inputValidator.validateId(id, "userTag id");
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.id = ? AND ut.user_id =? `;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userTagIdNum, userIdNum],
        mapper: this.userTagMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve userTag relationship by Id and user Id",
        {
          attemptedData: { userTagId: userTagIdNum, userId: userIdNum },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.findByIdAndUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Finds a specific user-tag relationship by user Id and tag Id
   * @param {number} userId - Id of the user
   * @param {number} tagId - Id of the tag
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<UserTag|null>} UserTag entity if found, null otherwise
   * @throws {ValidationError} If the user Id or tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByUserIdAndTagId(userId, tagId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const baseQuery = `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.user_id = ? AND ut.tag_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum, tagIdNum],
        mapper: this.userTagMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve user-tag relationship by user_id and tag_id",
        {
          attemptedData: { userId: userIdNum, tagId: tagIdNum },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.findByUserIdAndTagId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Finds all user-tag relationships for a specific tag with optional pagination and sorting
   * @param {Object} options - Configuration options for the query
   * @param {number} options.tagId - Id of the tag whose user associations to retrieve
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {string} [options.sortBy=USER_TAG_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @returns {Promise<Array<UserTag>>} Array of UserTag entities
   * @throws {ValidationError} If the tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByTagId({
    tagId,
    externalConn = null,
    sortBy = USER_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const baseQuery = `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.tag_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [tagIdNum],
        sortBy,
        sortOrder,
        sortConstants: USER_TAG_SORT_FIELD,
        entityType: "USER_TAG",
        entityName: "userTag",
        limit,
        offset,
        mapper: this.userTagMapper.dbToDomain,
      });

      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Error retrieving user-tag associations by tagId",
        {
          attemptedData: {
            tagId,
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.findAllByTagId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = UserTagDAO;
