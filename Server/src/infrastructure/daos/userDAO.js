const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const { MAPPER_TYPES } = require("../constants/mapperConstants");
const { SORT_ORDER, USER_SORT_FIELD } = require("../constants/sortConstants");

class UserDAO extends BaseDatabaseHandler {
  /**
   * @typedef {import('../../types/entities').User} User
   * @typedef {import('../../types/entities').Connection} Connection
   */
  constructor({ userMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB);
    this.userMapper = userMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  /**
   * Creates a new user in the database.
   * @param {User} user - User domain entity to persist.
   * @param {string} user.userName - User account username (must be unique).
   * @param {string} user.email - User account email (must be unique).
   * @param {string} user.password - User account password (should be pre-hashed).
   * @param {string} user.rol - User account rol.
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<User>} Persisted user entity with assigned ID and timestamps.
   * @throws {ConflictError} When username or email already exists.
   * @throws {DatabaseError} On database operation failure.
   */
  async create(user, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO users (user_name, email, password, rol) VALUES (?, ?, ?, ?)",
        [user.userName, user.email, user.password, user.rol]
      );

      // Retrieve the complete created user with generated Id and timestamps
      const createdUser = await this.findById(result.insertId, connection);

      return createdUser;
    } catch (error) {
      // Handle duplicate entry errors(username or email aready exists)
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        if (error.message.includes("user_name")) {
          throw this.errorFactory.createConflictError(
            "Username is already taken",
            {
              attemptedData: { userName: user.userName },
            }
          );
        } else if (error.message.includes("email")) {
          throw this.errorFactory.createConflictError(
            "Email is already taken",
            {
              attemptedData: { email: user.email },
            }
          );
        }
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to create user", {
        attemptedData: { userId: user.id, userName: user.userName },
        originalError: error.message,
        code: error.code,
        context: "userDAO.create",
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Updates an existing user in the database.
   * @param {User} user User domain entity with updated data.
   * @param {number} user.id - ID of the user to update (required and unique).
   * @param {string} user.userName - New username (must be unique).
   * @param {string} user.email - New email (must be unique).
   * @param {string} user.password - New password (should be pre-hashed).
   * @param {string} user.rol - New rol.
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<User>} Updated user entity with timestamps.
   * @throws {ConflictError} When username or email already exists or taken.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If input validation fails.
   */
  async update(user, externalConn = null) {
    // Get database connection (new or existing for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "UPDATE users SET user_name = ?, email = ?, password = ?, rol=? WHERE id = ?",
        [user.userName, user.email, user.password, user.rol, user.id]
      );

      // Retrieve the complete updated user with their updated timestamps
      const updatedUser = await this.findById(result.insertId, connection);

      return updatedUser;
    } catch (error) {
      // Handle duplicate entry errors(username or email aready exists)
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        if (error.message.includes("user_name")) {
          throw this.errorFactory.createConflictError(
            "Username already taken",
            {
              attemptedData: { userName: user.userName },
            }
          );
        } else if (error.message.includes("email")) {
          throw this.errorFactory.createConflictError("Email already taken", {
            attemptedData: { email: user.email },
          });
        }
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to update user", {
        attemptedData: { userId: user.id, userName: user.userName },
        originalError: error.message,
        code: error.code,
        context: "userDAO.update",
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes a user from the database by their id.
   * @param {number} id - The ID of the user to delete (required and unique).
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Boolean>} True if the user was successfully deleted, false if the user didn't exist.
   * @throws {ConflictError} When user has associated tasks or sessions.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If input validation fails.
   */
  async delete(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.inputValidator.validateId(id, "user id");
      const [result] = await connection.query(
        "DELETE FROM users WHERE id = ?",
        [userIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw this.errorFactory.createConflictError(
          "Failed to delete user: user has associated tasks or sessions",
          { attemptedData: { userId: id } }
        );
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to delete user", {
        attemptedData: { userId: id },
        originalError: error.message,
        code: error.code,
        context: "userDAO.delete",
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieve a user from the database by their id.
   * @param {number} id  - The id of the user to  retrieve (required and unique).
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<User>} User domain entity if was found, null if the user didn't exist.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If input validation fails.
   */
  async findById(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.inputValidator.validateId(id, "user id");
      const baseQuery = `SELECT  
          id AS user_id,
          user_name,
          email,
          password,
          rol,
          created_at AS user_created_at 
          FROM users WHERE id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
        mapper: this.userMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve user by id",
        {
          attemptedData: { userId: id },
          originalError: error.message,
          code: error.code,
          context: "userDAO.findById",
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
   * Retrieve a user from the database by their username
   * @param {string} userName - The username of the user to found (must be unique)
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<User>} User domain entity if was found, null if the user didn't exist.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If input validation fails.
   */
  async findByUserName(userName, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (typeof userName !== "string" || userName.trim().length === 0) {
        throw this.errorFactory.createValidationError("Invalid user name");
      }

      const cleanUserName = userName.trim();

      const baseQuery = `SELECT  
        u.id AS user_id,
        u.user_name,
        u.email,
        u.password,
        u.rol,
        u.created_at AS user_created_at 
       FROM users u 
       WHERE u.user_name = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [cleanUserName],
        mapper: this.userMapper.dbToDomain,
      });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve user by username",
        {
          attemptedData: {
            userNameLength: cleanUserName ? cleanUserName.length : 0,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userDAO.findByUserName",
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
   * Retrieve a user from the database by their email
   * @param {string} email - The email of the user to found (must be unique)
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<User>} User domain entity if was found, null if the user didn't exist.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If input validation fails.
   */
  async findByEmail(email, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (typeof email !== "string" || email.trim().length === 0) {
        throw this.errorFactory.createValidationError("Invalid email");
      }

      const cleanEmail = email.trim().toLowerCase();

      const baseQuery = `SELECT  
        u.id AS user_id,
        u.user_name,
        u.email,
        u.password,
        u.rol,
        u.created_at AS user_created_at 
       FROM users u 
       WHERE u.email = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [cleanEmail],
        mapper: this.userMapper.dbToDomain,
      });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve user by email",
        {
          attemptedData: {
            emailPrefix: email ? email.split("@")[0] + "@***" : "null",
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userDAO.findByEmail",
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
 * Retrieve a user from the database by both email and username
 * @param {string} email - The email of the user to find
 * @param {string} userName - The username of the user to find  
 * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
 * @returns {Promise<User>} User domain entity if found, null if the user doesn't exist.
 * @throws {DatabaseError} On database operation failure.
 * @throws {ValidationError} If input validation fails.
 */
async findByEmailAndUsername(email, userName, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
        if (typeof email !== "string" || email.trim().length === 0) {
            throw this.errorFactory.createValidationError("Invalid email");
        }
        if (typeof userName !== "string" || userName.trim().length === 0) {
            throw this.errorFactory.createValidationError("Invalid user name");
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanUserName = userName.trim();

        const baseQuery = `SELECT  
            u.id AS user_id,
            u.user_name,
            u.email,
            u.password,
            u.rol,
            u.created_at AS user_created_at 
           FROM users u 
           WHERE u.email = ? AND u.user_name = ?`;

        const result = await this._executeQuery({
            connection,
            baseQuery,
            params: [cleanEmail, cleanUserName],
            mapper: this.userMapper.dbToDomain,
        });
        
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        // Re-throw ValidationErrors (input issues)
        if (error instanceof this.errorFactory.Errors.ValidationError) {
            throw error;
        }

        // Handle all other database errors
        throw this.errorFactory.createDatabaseError(
            "Failed to retrieve user by email and username",
            {
                attemptedData: {
                    emailPrefix: email ,
                    userNameLength: userName ? userName.length : 0,
                },
                originalError: error.message,
                code: error.code,
                stack: error.stack,
                context: "userDAO.findByEmailAndUsername",
            }
        );
    } finally {
        if (connection && !isExternal) {
            await this.releaseConnection(connection, isExternal);
        }
    }
}

  /**
   * Retrieves all users from the database with optional pagination, sorting, and filtering.
   * @param {Object} [options={}] - Configuration options for the query.
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
   * @param {number} [options.offset=null] - Number of records to skip for pagination.
   * @param {string} [options.sortBy=USER_SORT_FIELD.CREATED_AT] - Field to sort results by.
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
   * @returns {Promise<Array>} Array of User domain entity.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails.
   */
  async findAll({
    externalConn = null,
    limit = null,
    offset = null,
    sortBy = USER_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const baseQuery = `SELECT 
     u.id AS user_id,
     u.user_name,
     u.email,
     u.password,
     u.rol,
     u.created_at AS user_created_at
     FROM users u `;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        sortBy,
        sortOrder,
        sortConstants: USER_SORT_FIELD,
        entityType: "USER",
        entityName: "user",
        limit,
        offset,
        mapper: this.userMapper.dbToDomain,
      });
      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all users",
        {
          attemptedData: {
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "userDAO.findAll",
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
   * Retrieve a user with their tags from the database
   * @param {number} id - The id of the user to retrieve
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @returns User domain entity if was found, null if the user didn't exist.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails.
   */
  async findByIdWithUserTags(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.inputValidator.validateId(id, "user id");
      const baseQuery = `
        SELECT 
        u.id AS user_id,
        u.user_name,
        u.email,
        u.password,
        u.rol,
        u.created_at AS user_created_at,
        ut.id AS user_tag_id,
        ut.created_at AS user_tag_created_at,
        t.id AS tag_id,
        t.name AS tag_name,
        t.description AS tag_description,
        t.created_at AS tag_created_at
        FROM users u
        LEFT JOIN user_tag ut ON u.id = ut.user_id
        LEFT JOIN tags t ON ut.tag_id = t.id
        WHERE u.id = ?;`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
        mapper: this.userMapper.dbToDomainWithTags,
        mapperType: MAPPER_TYPES.ALL_ROWS,
      });

      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve user with tags",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          context: "userDAO.findByIdWithTags",
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

module.exports = UserDAO;
