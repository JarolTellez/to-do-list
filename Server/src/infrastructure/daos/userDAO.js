const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
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
   * Creates a new user in the database
   * @param {User} user - User domain entity to persist
   * @param {Connection}[externalConn=null] - External databse connection
   * @returns {Promise<User>} Persisted user entity with assigned ID
   * @throws {ConflictError} When username or email already exists
   * @throws {DatabaseError} On database operation failure
   */
  async create(user, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO users (user_name, email, password, rol) VALUES (?, ?, ?, ?)",
        [user.userName, user.email, user.password, user.rol]
      );

      const actualUser = this.findById(result.insertId, connection);

      return actualUser;
    } catch (error) {
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
      throw this.errorFactory.createDatabaseError("Failed to create user", {
        attemptedData: { userId: user.id, userName: user.userName },
        originalError: error.message,
        code: error.code,
        context: "userDAO - create method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async update(user, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "UPDATE users SET user_name = ?, email = ?, password = ? WHERE id = ?",
        [user.userName, user.email, user.password, user.id]
      );

      const updatedUser = this.findById(result.insertId, connection);

      return updatedUser;
    } catch (error) {
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
      throw this.errorFactory.createDatabaseError("Failed to update user", {
        attemptedData: { userId: user.id, userName: user.userName },
        originalError: error.message,
        code: error.code,
        context: "userDAO - update method",
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

      throw this.errorFactory.createDatabaseError("Failed to delete user", {
        attemptedData: { userId: id },
        originalError: error.message,
        code: error.code,
        context: "userDAO - delete method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //READ
  //obtiene todos los usuarios
  async findAll({
    externalConn = null,
    limit = null,
    offset = null,
    sortBy = USER_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        USER_SORT_FIELD,
        "USER",
        "user sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(sortOrder, SORT_ORDER);

      const queryParams = [];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);

      const [rows] = await connection.query(
        `SELECT 
     u.id AS user_id,
     u.user_name,
     u.email,
     u.password,
     u.rol,
     u.created_at AS user_created_at
     FROM users u 
     ORDER BY ${safeField} ${safeOrder}, u.id ASC
     ${limit !== null ? "LIMIT ?" : ""} 
     ${offset !== null ? "OFFSET ?" : ""}`,
        queryParams
      );

      const mappedUsers =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.userMapper.dbToDomain(row))
          : [];

      return mappedUsers;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to delete all users",
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
          context: "userDAO - adminFindAll mehtod",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Busca usuario por id
  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.inputValidator.validateId(id, "user id");
      const [rows] = await connection.execute(
        `SELECT  
          id AS user_id,
          user_name,
          email,
          password,
          rol,
          created_at AS user_created_at 
          FROM users WHERE id = ?`,
        [userIdNum]
      );
      const mappedUser = this.userMapper.dbToDomain(rows[0]);
      return mappedUser;
    } catch (error) {
      throw this.errorFactory.createDatabaseError("Failed to retrieve user by id", {
        attemptedData: { userId: id },
        originalError: error.message,
        code: error.code,
        context: "userDAO - findById Method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Busca usuario por username
  async findByUserName(userName, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (typeof userName !== "string" || userName.trim().length === 0) {
        throw this.errorFactory.createValidationError("Invalid user name");
      }

      const cleanUserName = userName.trim();

      const [rows] = await connection.execute(
        `SELECT  
        u.id AS user_id,
        u.user_name,
        u.email,
        u.password,
        u.rol,
        u.created_at AS user_created_at 
       FROM users u 
       WHERE u.user_name = ?`,
        [cleanUserName]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.userMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to retrieve user by username", {
        attemptedData: {
          userNameLength: userName?.length || 0,
        },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        context: "userDAO - findByUserName method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Busca usuario por email
  async findByEmail(email, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (typeof email !== "string" || email.trim().length === 0) {
        throw  this.errorFactory.createValidationError("Invalid email");
      }

      const cleanEmail = email.trim().toLowerCase();

      const [rows] = await connection.execute(
        `SELECT  
        u.id AS user_id,
        u.user_name,
        u.email,
        u.password,
        u.rol,
        u.created_at AS user_created_at 
       FROM users u 
       WHERE u.email = ?`,
        [cleanEmail]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.userMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to retrieve user by email", {
        attemptedData: {
          emailPrefix: email ? email.split("@")[0] + "@***" : "null",
        },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        context: "userDAO - findByEmail method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //ELIMINAR(SE USARA SOLO EL FIND BY USERNAME LA VALIDAICON DE CONTRASENA SE HACE EN CAPA SERVICES)
  async findByNameAndPassword(userName, password, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        `SELECT  
          id AS user_id,
          user_name,
          email,
          password,
          rol,
          created_at AS user_created_at 
          FROM users 
          WHERE user_name = ?`,
        [userName]
      );

      const usuarioBD = rows[0];
      // PASAR VALIDACION AL SERVICE Y ELIMINAR ESTE METODO DE LA DAO
      // const isValid = await this.bcrypt.compare(
      //   password.trim(),
      //   usuarioBD.password
      // );

      // if (!isValid) {
      //   throw new ConflictError("Credenciales inválidas", {
      //     attemptedData: { userName, password },
      //   });
      // }

      const mappedUser = this.userMapper.dbToDomain(usuarioBD);
      return mappedUser;
    } catch (error) {
      throw this.errorFactory.createDatabaseError("Failed to retrieve user by credentials", {
        attemptedData: { userName, password },
        originalError: error.message,
        code: error.code,
        sqlState: error.sqlState,
        errno: error.errno,
        context: "userDAO - findByNameAn method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta un usuario con sus etiquetas
  async findByIdWithUserTags(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.query(
        `
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
        WHERE u.id = ?;
        `,
        [userId]
      );

      // Si no hay resultados retornar null
      if (!rows || rows.length === 0) {
        return null;
      }
      const mappedUser = this.userMapper.dbToDomainWithTags(rows);

      return mappedUser;
    } catch (error) {
      throw this.errorFactory.createDatabaseError("Failed to retrieve user with tags", {
        attemptedData: { userId },
        originalError: error.message,
        code: error.code,
        context: "userDAO - findByIdWithTags method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = UserDAO;
