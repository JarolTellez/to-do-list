class UsuarioDAO {

   constructor(usuarioMapper, conexionBD, bcrypt, DatabaseError) {
    this.usuarioMapper = usuarioMapper;
    this.conexionBD = conexionBD;
    this.bcrypt = bcrypt;
     this.DatabaseError = DatabaseError;
  }

  
   async agregarUsuario(usuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [resultado] = await connection.query(
        "INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena, usuario.rol]
      );
      usuario.idUsuario = resultado.insertId;
      return usuario;
    } catch (error) {
      console.error("Error al agregar usuario", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async actualizarUsuario(usuario) {
    const connection = await this.conexionBD.conectar();
    try {
      await connection.query(
        "UPDATE usuarios SET nombre_usuario = ?, correo = ?, contrasena = ? WHERE id_usuario = ?",
        [
          usuario.nombreUsuario,
          usuario.correo,
          usuario.contrasena,
          usuario.idUsuario,
        ]
      );
      return usuario;
    } catch (error) {
      console.error("Error al actualizar usuario", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async eliminarUsuario(idUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      await connection.query("DELETE FROM usuarios WHERE id_usuario = ?", [
        idUsuario,
      ]);
    } catch (error) {
      console.error("Error al eliminar usuario", error);
      throw error;
    } finally {
      connection.release();
    }
  }

 async consultarTodosUsuario() {
  const connection = await this.conexionBD.conectar();
  try {
    const [rows] = await connection.query("SELECT * FROM usuarios");

    if (!rows || rows.length === 0) {
      return []; 
    }

    return rows.map(row => this.usuarioMapper.bdToDominio(row));
  } catch (error) {
    console.error("Error al consultar todos los usuarios", error);
    throw error;
  } finally {
    connection.release();
  }
}


   async consultarUsuarioPorId(idUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuarios WHERE id_usuario = ?",
        [idUsuario]
      );
      if (!rows || rows.length === 0) {
        return null; 
    }

    return this.usuarioMapper.bdToDominio(rows[0]);
    } catch (error) {
      console.error("Error al consultar usuario por id", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarUsuarioPorNombre(nombreUsuario) {
    const connection = await this.conexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuarios WHERE nombre_usuario = ?",
        [nombreUsuario]
      );
    if (!rows || rows.length === 0) {
        return null; 
    }

    return this.usuarioMapper.bdToDominio(rows[0]);

    } catch (error) {
      console.error("Error al consultar usuario por nombre", error);
      throw error;
    } finally {
      connection.release();
    }
  }


 async consultarUsuarioPorNombreContrasena(nombreUsuario, contrasena) {
    const connection = await this.conexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuarios WHERE nombre_usuario = ?",
        [nombreUsuario]
      );
      if (!rows || rows.length === 0) return null;
      
      const usuarioBD = rows[0];
      const isValid = await this.bcrypt.compare(contrasena.trim(), usuarioBD.contrasena);
      return isValid ? this.usuarioMapper.bdToDominio(usuarioBD) : null;
    } catch (error) {
      console.error("Error al consultar usuario", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports=UsuarioDAO;