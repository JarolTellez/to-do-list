const ConexionBD = require("../utils/conexionBD");

class UsuarioDAO {
  static async agregarUsuario(usuario) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
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

  static async actualizarUsuario(usuario) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
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

  static async eliminarUsuario(idUsuario) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
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

  static async consultarTodosUsuario() {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
    try {
      const [rows] = await connection.query("SELECT * FROM usuarios");
      return rows;
    } catch (error) {
      console.error("Error al consultar todos los usuarios", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarUsuarioPorId(idUsuario) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuarios WHERE id_usuario = ?",
        [idUsuario]
      );
      return rows[0];
    } catch (error) {
      console.error("Error al consultar usuario por id", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarUsuarioPorNombre(nombreUsuario) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuarios WHERE nombre_usuario = ?",
        [nombreUsuario]
      );
      return rows[0];
    } catch (error) {
      console.error("Error al consultar usuario por nombre", error);
      throw error;
    } finally {
      connection.release();
    }
  }


static async consultarUsuarioPorNombreContrasena(nombreUsuario,contrasena) {
  const conexionBD = ConexionBD.getInstance();
  const connection = await conexionBD.conectar();
  try {
    const [rows] = await connection.query(
      "SELECT * FROM usuarios WHERE nombre_usuario = ? AND contrasena = ?",
      [nombreUsuario,contrasena]
    );
    return rows[0];
  } catch (error) {
    console.error("Error al consultar usuario por nombre y contrasena", error);
    throw error;
  } finally {
    connection.release();
  }
}
}

module.exports=UsuarioDAO;