const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class UsuarioDAO extends BaseDatabaseHandler {
  constructor({usuarioMapper, conexionBD, bcrypt, DatabaseError, NotFoundError, ConflictError}) {
    super(conexionBD);
    this.usuarioMapper = usuarioMapper;
    this.bcrypt = bcrypt;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

  async agregarUsuario(usuario, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena, usuario.rol]
      );
      usuario.idUsuario = resultado.insertId;
      return usuario;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        if (error.message.includes('nombre_usuario')) {
          throw new this.ConflictError('El nombre de usuario ya está en uso', {
            nombreUsuario: usuario.nombreUsuario,
          });
        } else if (error.message.includes('correo')) {
          throw new this.ConflictError('El correo electrónico ya está registrado', {
            correo: usuario.correo,
          });
        }
      }
      throw new this.DatabaseError('No se pudo registrar el usuario', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async actualizarUsuario(usuario, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "UPDATE usuarios SET nombre_usuario = ?, correo = ?, contrasena = ? WHERE id_usuario = ?",
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena, usuario.idUsuario]
      );

      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
      return usuario;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        if (error.message.includes('nombre_usuario')) {
          throw new this.ConflictError('El nombre de usuario ya está en uso', {
            nombreUsuario: usuario.nombreUsuario,
          });
        } else if (error.message.includes('correo')) {
          throw new this.ConflictError('El correo electrónico ya está registrado', {
            correo: usuario.correo,
          });
        }
      }
      throw new this.DatabaseError('No se pudo actualizar el usuario', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async eliminarUsuario(idUsuario, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.query(
        "DELETE FROM usuarios WHERE id_usuario = ?",
        [idUsuario]
      );

      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar el usuario porque tiene tareas o sesiones asociadas',
          { idUsuario }
        );
      }

      throw new this.DatabaseError('No se pudo eliminar el usuario', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async consultarTodosUsuario(externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute("SELECT * FROM usuarios");
      return rows.length > 0 ? rows.map((r) => this.usuarioMapper.bdToDominio(r)) : [];
    } catch (error) {
      throw new this.DatabaseError('No se pudo consultar los usuarios', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async consultarUsuarioPorId(idUsuario, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM usuarios WHERE id_usuario = ?",
        [idUsuario]
      );
      if (!rows || rows.length === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
      return this.usuarioMapper.bdToDominio(rows[0]);
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      throw new this.DatabaseError('No se pudo consultar el usuario', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

async consultarUsuarioPorNombre(nombreUsuario, externalConn = null) {
  const { connection, isExternal } = await this.getConnection(externalConn);
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM usuarios WHERE nombre_usuario = ?",
      [nombreUsuario]
    );
    
    // Si no hay resultados, retornar null o undefined
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return this.usuarioMapper.bdToDominio(rows[0]);
    
  } catch (error) {
    throw new this.DatabaseError('No se pudo consultar el usuario por nombre', {
      originalError: error.message,
      code: error.code,
    });
  } finally {
    await this.releaseConnection(connection, isExternal);
  }
}

  async consultarUsuarioPorCorreo(correo, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM usuarios WHERE correo = ?",
        [correo]
      );
      if (!rows || rows.length === 0) {
        throw new this.NotFoundError('Usuario no encontrado');
      }
      return this.usuarioMapper.bdToDominio(rows[0]);
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      throw new this.DatabaseError('No se pudo consultar el usuario por correo', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async consultarUsuarioPorNombreContrasena(nombreUsuario, contrasena, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM usuarios WHERE nombre_usuario = ?",
        [nombreUsuario]
      );
      if (!rows || rows.length === 0) {
        throw new this.NotFoundError('Credenciales inválidas');
      }

      const usuarioBD = rows[0];
      const isValid = await this.bcrypt.compare(contrasena.trim(), usuarioBD.contrasena);

      if (!isValid) {
        throw new this.ConflictError('Credenciales inválidas');
      }
      return this.usuarioMapper.bdToDominio(usuarioBD);
    } catch (error) {
      if (error instanceof this.NotFoundError || error instanceof this.ConflictError) {
        throw error;
      }
      throw new this.DatabaseError('No se pudo verificar las credenciales', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}


module.exports=UsuarioDAO;

