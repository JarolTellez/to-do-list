const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const bcrypt = require('bcryptjs');

const {DatabaseError,ConflictError} = require('../../utils/appErrors');
class UserDAO extends BaseDatabaseHandler {
  /**
   * @typedef {import('../../types/entities').User} User
   * @typedef {import('../../types/entities').Connection} Connection
   */
  constructor({
    userMapper,
    connectionDB,
  }) {
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
      user.id = result.insertId;
      return user;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        if (error.message.includes("nombre_usuario")) {
          throw new ConflictError("El nombre de usuario ya está en uso", {
            attemptedData: { userName: user.userName },
          });
        } else if (error.message.includes("email")) {
          throw new ConflictError(
            "El email electrónico ya está registrado",
            {
              attemptedData: { email: user.email },
            }
          );
        }
      }
      throw new DatabaseError("No se pudo registrar el user", {
        attemptedData: { userId: user.id, userName: user.userName },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
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
          throw new ConflictError(
            "El email electrónico ya está registrado",
            {
              attemptedData: { email: user.email },
            }
          );
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
      await this.releaseConnection(connection, isExternal);
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
      await this.releaseConnection(connection, isExternal);
    }
  }

  //READ
  //obtiene todos los usuarios
  async findAll(externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(`
        SELECT 
        id AS user_id,
        user_name,
        email,
        password,
        rol,
        created_at AS user_created_at
        FROM users;`);
      return rows.length > 0
        ? rows.map((r) => this.userMapper.dbToDomain(r))
        : [];
    } catch (error) {
      throw new DatabaseError(
        "Error al consultar todos los usuarios en la base de datos",
        {
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Busca usuario por id
  async findById(id, externalConn = null) {
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
          FROM users WHERE id = ?`,
        [id]
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
      await this.releaseConnection(connection, isExternal);
    }
  }

  //busca usuario por username
  async findByUserName(userName, externalConn = null) {
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

      // Si no hay resultados, retornar null 
      if (!rows || rows.length === 0) {
        return null;
      }

      return this.userMapper.dbToDomain(rows[0]);
    } catch (error) {
      throw new DatabaseError(
        "Error al consultar el usuario en la base de datos",
        {
          attemptedData: { userName },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // busca usuario por email
  async findByEmail(email, externalConn = null) {
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
          WHERE email = ?`,
        [email]
      );
      
      // Si no hay resultados, retornar null 
      if (!rows || rows.length === 0) {
        return null;
      }
      const mappedUser = this.userMapper.dbToDomain(rows[0]);
      return mappedUser;
    } catch (error) {
      throw new DatabaseError(
        "Error al consultar el usuario por email en la base de datos",
        {
          attemptedData: { email },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

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
      // Para errores de BD, muestra más detalles
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
      await this.releaseConnection(connection, isExternal);
    }
  }

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
      await this.releaseConnection(connection, isExternal);
    }
    
  }
}

module.exports = UserDAO;
