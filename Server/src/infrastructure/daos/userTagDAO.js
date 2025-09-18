const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const {
  SORT_ORDER,
  USER_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class UserTagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  async create(userTag, externalConn = null) {
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

      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to create user-tag relationship", {
        attemptedData: { userId: userTag.userId, tagId: userTag.tagId },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        context: "userTag DAO - create method",
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
      const idNum = this.inputValidator.validateId(id, "userTag id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE id = ? ",
        [idNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to delete user-tag relationship", {
        attemptedData: { id, userId },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        contest: "DAO layer - delete by id and userId method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async deleteByIdAndUserId(id, userId, externalConn = null) {
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to delete user-tag relationship", {
        attemptedData: { id, userId },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        contest: "DAO layer - delete by id and userId method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async deleteByUserIdAndTagId(userId, tagId, externalConn = null) {
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to delete user-tag relationship", {
        attemptedData: { userId, tagId },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        context: "DAO layer - delete by userId and tagId",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async deleteAllByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE user_id = ?",
        [userIdNum]
      );

      return result.affectedRows;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to delete al user-tag relationship for the specific user",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTag DAO - bulk deletion by userId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async deleteAllByTagId(tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE tag_id = ?",
        [tagIdNum]
      );

      return result.affectedRows;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to delete all user-tag relationships for the specified tag",
        {
          attemptedData: { tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTag DAO - bulk deletion by tagId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findByIdAndUserId(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const idNum = this.inputValidator.validateId(id, "userTag id");
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const [rows] = await connection.execute(
        `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.id = ? `,
        [idNum, userIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedUser = this.tagMapper.dbToDomain(rows[0]);
      return  mappedUser;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve userTag relationship by ID and user ID",
        {
          attemptedData: { id, userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO - find by id and userId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findByUserIdAndTagId(userId, tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [rows] = await connection.execute(
        `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.user_id = ? AND ut.tag_id = ?`,
        [userIdNum, tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.tagMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve user-tag relationship by user_id and tag_id",
        {
          attemptedData: { userId, tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTag DAO - find by userId and tagId",
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
      sortBy = USER_TAG_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");
      
      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        USER_TAG_SORT_FIELD,
        "USER_TAG",
        "user tag sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(sortOrder, SORT_ORDER);

       const queryParams = [tagIdNum];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);

      const [rows] = await connection.query(
        `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.tag_id = ?
         ORDER BY ${safeField} ${safeOrder}, ut.id ASC
         LIMIT ? OFFSET ?`,
        queryParams
      );

      const mappedUserTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return mappedUserTags;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Error retrieving user-tag associations by tagId",
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
          context: "userTagDAO - find by tagId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = UserTagDAO;
