const BaseDatabaseHandler = require("../config/baseDatabaseHandler");

class UserDAO extends BaseDatabaseHandler {
  constructor({userMapper, connectionDB, bcrypt, DatabaseError, ConflictError}) {
    super(connectionDB);
    this.userMapper = userMapper;
    this.bcrypt = bcrypt;
    this.DatabaseError = DatabaseError;
    this.ConflictError = ConflictError;
  }

  async create(user, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'INSERT INTO users (user_name, email, password, rol) VALUES (?, ?, ?, ?)',
        [user.userName, user.email, user.password, user.rol]
      );
      user.id = result.insertId;
      return user;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        if (error.message.includes('nombre_usuario')) {
          throw new this.ConflictError('El nombre de usuario ya está en uso', {
           attemptedData:{userName: user.userName},
          });
        } else if (error.message.includes('email')) {
          throw new this.ConflictError('El email electrónico ya está registrado', {
            attemptedData:{email: user.email},
          });
        }
      }
      throw new this.DatabaseError('No se pudo registrar el user', {
        attemptedData:{userId: user.id, userName: user.userName},
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
        'UPDATE users SET user_name = ?, email = ?, password = ? WHERE id = ?',
        [user.userName, user.email, user.password, user.id]
      );

      
      return user;
    } catch (error) {
    
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        if (error.message.includes('nombre_usuario')) {
          throw new this.ConflictError('El nombre de user ya está en uso', {
             attemptedData:{userName: user.userName},
          });
        } else if (error.message.includes('email')) {
          throw new this.ConflictError('El email electrónico ya está registrado', {
           attemptedData:{email: user.email},
          });
        }
      }
      throw new this.DatabaseError('Error al actualizar el usuario en la base de datos', {
        attemptedData:{userId: user.id, userName: user.userName},
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async delete(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      return result.affectedRows>0;
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar el usario porque tiene tareas o sesiones asociadas',
          {attemptedData:{userId:id} }
        );
      }

      throw new this.DatabaseError('Error al eliminar el usuario de la base de datos', {
        attemptedData:{userId:id},
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findAll(externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute('SELECT * FROM users');
      return rows.length > 0 ? rows.map((r) => this.userMapper.dbToDomain(r)) : [];
    } catch (error) {
      throw new this.DatabaseError('Error al consultar todos los usuarios en la base de datos', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      const mappedUser=this.userMapper.dbToDomain(rows[0]);
      return mappedUser;
    } catch (error) {
      throw new this.DatabaseError('Error al consultar el usuario en la base de datos', {
        attemptedData:{userId:id},
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

async findByName(userName, externalConn = null) {
  const { connection, isExternal } = await this.getConnection(externalConn);
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE user_name = ?',
      [userName]
    );
    
    // Si no hay resultados, retornar null o undefined
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return this.userMapper.dbToDomain(rows[0]);
    
  } catch (error) {
    throw new this.DatabaseError('Error al consultar el usuario en la base de datos', {
      attemptedData:{userName},
      originalError: error.message,
      code: error.code,
    });
  } finally {
    await this.releaseConnection(connection, isExternal);
  }
}

  async findByEmail(email, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
     const mappedUser= this.userMapper.dbToDomain(rows[0]);
      return mappedUser;
    } catch (error) {
      throw new this.DatabaseError('Error al consultar el usuario por email en la base de datos', {
        attemptedData:{email},
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findByNameAndPassword(userName, password, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE user_name = ?',
            [userName]
        );

        const usuarioBD = rows[0];
        const isValid = await this.bcrypt.compare(password.trim(), usuarioBD.password);

        if (!isValid) {
            throw new this.ConflictError('Credenciales inválidas',{attemptedData:{userName, password}});
        }

        const mappedUser=this.userMapper.dbToDomain(usuarioBD);
        return mappedUser;

    } catch (error) {
        // Para errores de BD, muestra más detalles
        throw new this.DatabaseError('Error al consultar usuario por credenciales en la base de datos', {
            attemptedData:{userName, password},
            originalError: error.message,
            code: error.code,
            sqlState: error.sqlState,
            errno: error.errno
        });
    } finally {
        await this.releaseConnection(connection, isExternal);
    }
}
}


module.exports=UserDAO;

