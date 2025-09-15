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

const { SORT_ORDER, USER_SORT_FIELD } = require("../constants/sortConstants");

class UserDAO extends BaseDatabaseHandler {
  /**
   * @typedef {import('../../types/entities').User} User
   * @typedef {import('../../types/entities').Connection} Connection
   */
  constructor({ userMapper, connectionDB }) {
    super(connectionDB);
    this.userMapper = userMapper;
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

      const actualUser = this.findById(result.insertId);

      return actualUser;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        if (error.message.includes("nombre_usuario")) {
          throw new ConflictError("El nombre de usuario ya está en uso", {
            attemptedData: { userName: user.userName },
          });
        } else if (error.message.includes("email")) {
          throw new ConflictError("El email electrónico ya está registrado", {
            attemptedData: { email: user.email },
          });
        }
      }
      throw new DatabaseError("No se pudo registrar el user", {
        attemptedData: { userId: user.id, userName: user.userName },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
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

      return user;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        if (error.message.includes("nombre_usuario")) {
          throw new ConflictError("El nombre de user ya está en uso", {
            attemptedData: { userName: user.userName },
          });
        } else if (error.message.includes("email")) {
          throw new ConflictError("El email electrónico ya está registrado", {
            attemptedData: { email: user.email },
          });
        }
      }
      throw new DatabaseError(
        "Error al actualizar el usuario en la base de datos",
        {
          attemptedData: { userId: user.id, userName: user.userName },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async delete(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.query(
        "DELETE FROM users WHERE id = ?",
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw new ConflictError(
          "No se puede eliminar el usario porque tiene tareas o sesiones asociadas",
          { attemptedData: { userId: id } }
        );
      }

      throw new DatabaseError(
        "Error al eliminar el usuario de la base de datos",
        {
          attemptedData: { userId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  //READ
  //obtiene todos los usuarios
  async findAll({
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = USER_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { safeField } = validateSortField(
        sortBy,
        USER_SORT_FIELD,
        "USER",
        "user sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de usuarios
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total FROM users u`
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
          "users"
        );
      }

      // CONSULTA 2: Obtener IDs de usuarios paginados
      const [userIdsResult] = await connection.query(
        `SELECT u.id
       FROM users u 
       ORDER BY ${safeField} ${safeOrder}, u.id ASC
       LIMIT ? OFFSET ?`,
        [pagination.limit, pagination.offset]
      );

      if (userIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "users"
        );
      }

      const userIds = userIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los usuarios paginados
      const [rows] = await connection.query(
        `SELECT 
         u.id AS user_id,
         u.user_name,
         u.email,
         u.password,
         u.rol,
         u.created_at AS user_created_at
       FROM users u 
       WHERE u.id IN (?)
       ORDER BY FIELD(u.id, ${userIds.map((_, index) => "?").join(",")})`,
        [userIds, ...userIds]
      );

      const mappedUsers =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.userMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedUsers,
        pagination,
        total,
        totalPages,
        "users"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in UserDAO.findAll:", {
        page,
        limit,
        sortBy,
        sortOrder,
        error: error.message,
      });

      throw new this.DatabaseError(
        "Error al consultar todos los usuarios en la base de datos",
        {
          attemptedData: {
            page,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  // Busca usuario por id
  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = Number(id);

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }
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
      throw new DatabaseError(
        "Error al consultar el usuario en la base de datos",
        {
          attemptedData: { userId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  // Busca usuario por username
  async findByUserName(userName, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (typeof userName !== "string" || userName.trim().length === 0) {
        throw new ValidationError("Invalid user name");
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
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in UserDAO.findByUserName:", {
        userNameLength: userName?.length || 0,
        error: error.message,
      });

      throw new this.DatabaseError(
        "Error al consultar el usuario en la base de datos",
        {
          attemptedData: {
            userNameLength: userName?.length || 0,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  // Busca usuario por email
  async findByEmail(email, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (typeof email !== "string" || email.trim().length === 0) {
        throw new ValidationError("Invalid email");
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
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in UserDAO.findByEmail:", {
        emailPrefix: email ? email.split("@")[0] + "@***" : "null",
        error: error.message,
      });

      throw new this.DatabaseError(
        "Error al consultar el usuario por email en la base de datos",
        {
          attemptedData: {
            emailPrefix: email ? email.split("@")[0] + "@***" : "null",
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
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
      throw new DatabaseError(
        "Error al consultar usuario por credenciales en la base de datos",
        {
          attemptedData: { userName, password },
          originalError: error.message,
          code: error.code,
          sqlState: error.sqlState,
          errno: error.errno,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
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
      throw new DatabaseError(
        "Error al consultar el usuario con etiquetas en la abse de datos",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }
}

module.exports = UserDAO;
