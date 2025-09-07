const BaseDatabaseHandler = require("../config/baseDatabaseHandler");

class UserDAO extends BaseDatabaseHandler {
  constructor({userMapper, connectionDB, bcrypt, DatabaseError, NotFoundError, ConflictError}) {
    super(connectionDB);
    this.userMapper = userMapper;
    this.bcrypt = bcrypt;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
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
          throw new this.ConflictError('El nombre de user ya está en uso', {
            userName: user.userName,
          });
        } else if (error.message.includes('email')) {
          throw new this.ConflictError('El email electrónico ya está registrado', {
            email: user.email,
          });
        }
      }
      throw new this.DatabaseError('No se pudo registrar el user', {
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

      if (result.affectedRows === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        if (error.message.includes('nombre_usuario')) {
          throw new this.ConflictError('El nombre de user ya está en uso', {
            userName: user.userName,
          });
        } else if (error.message.includes('email')) {
          throw new this.ConflictError('El email electrónico ya está registrado', {
            email: user.email,
          });
        }
      }
      throw new this.DatabaseError('No se pudo actualizar el user', {
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

      if (result.affectedRows === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar el user porque tiene tareas o sesiones asociadas',
          { id }
        );
      }

      throw new this.DatabaseError('No se pudo eliminar el user', {
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
      throw new this.DatabaseError('No se pudo consultar los usuarios', {
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
      if (!rows || rows.length === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
      return this.userMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      throw new this.DatabaseError('No se pudo consultar el user', {
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
    throw new this.DatabaseError('No se pudo consultar el user por nombre', {
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
      if (!rows || rows.length === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
      return this.userMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      throw new this.DatabaseError('No se pudo consultar el user por email', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // async findByNameAndPassword(userName, password, externalConn = null) {
  //   const { connection, isExternal } = await this.getConnection(externalConn);
  //   try {
  //     const [rows] = await connection.execute(
  //       'SELECT * FROM usuarios WHERE nombre_usuario = ?',
  //       [userName]
  //     );
  //     if (!rows || rows.length === 0) {
  //       throw new this.NotFoundError('Credenciales inválidas');
  //     }

  //     const dbUser = rows[0];
  //     const isValid = await this.bcrypt.compare(password.trim(), dbUser.password);

  //     if (!isValid) {
  //       throw new this.ConflictError('Credenciales inválidas');
  //     }
  //     return this.userMapper.dbToDomain(dbUser);
  //   } catch (error) {
  //     if (error instanceof this.NotFoundError || error instanceof this.ConflictError) {
  //       throw error;
  //     }
  //     throw new this.DatabaseError('No se pudo verificar las credenciales', {
  //       originalError: error.message,
  //       code: error.code,
  //     });
  //   } finally {
  //     await this.releaseConnection(connection, isExternal);
  //   }
  // }

  async findByNameAndPassword(userName, password, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE user_name = ?',
            [userName]
        );

        if (!rows || rows.length === 0) {
            throw new this.NotFoundError('Credenciales inválidas');
        }

        const usuarioBD = rows[0];
        const isValid = await this.bcrypt.compare(password.trim(), usuarioBD.password);

        if (!isValid) {
            throw new this.ConflictError('Credenciales inválidas');
        }

        return this.userMapper.dbToDomain(usuarioBD);

    } catch (error) {
        // Propaga errores conocidos
        if (error instanceof this.NotFoundError || error instanceof this.ConflictError) {
            throw error;
        }

        // Para errores de BD, muestra más detalles
        throw new this.DatabaseError('Error de autenticación', {
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

