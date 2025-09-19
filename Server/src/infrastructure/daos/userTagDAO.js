const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const {
  SORT_ORDER,
  USER_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class UserTagDAO extends BaseDatabaseHandler {
  constructor({ userTagMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB);
    this.userTagMapper = userTagMapper;
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

      return result.affectedRows > 0;
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
          context: "userTagDAO.deleteAllByUserId",
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

      return result.affectedRows > 0;
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
          context: "userTagDAO.deleteAllByTagId",
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve userTag relationship by ID and user ID",
        {
          attemptedData: { userTagId: userTagIdNum, userId: userIdNum },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userTagDAO.findByIdAndUserId",
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

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
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByTagId({
    tagId,
    externalConn = null,
    sortBy = USER_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

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
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = UserTagDAO;
