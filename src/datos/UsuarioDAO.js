const ConexionBD = require("../config/conexionBD");

class UsuarioDAO {
  static async agregarUsuario(usuario) {
    const connection = await ConexionBD.conectar();
    try {
      const [result] = await connection.query(
        "INSERT INTO usuario (nombreUsuario, correo, contrasena) VALUES (?, ?, ?)",
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena]
      );
      usuario.idUsuario = result.insertId;
      return usuario;
    } catch (error) {
      console.error("Error al agregar usuario", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async actualizarUsuario(usuario) {
    const connection = await ConexionBD.conectar();
    try {
      await connection.query(
        "UPDATE usuario SET nombreUsuario = ?, correo = ?, contrasena = ? WHERE idUsuario = ?",
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
    const connection = await ConexionBD.conectar();
    try {
      await connection.query("DELETE FROM usuario WHERE idUsuario = ?", [
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
    const connection = await ConexionBD.conectar();
    try {
      const [rows] = await connection.query("SELECT * FROM usuario");
      return rows;
    } catch (error) {
      console.error("Error al consultar todos los usuarios", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarUsuarioPorId(idUsuario) {
    const connection = await ConexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuario WHERE idUsuario = ?",
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
    const connection = await ConexionBD.conectar();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM usuario WHERE nombreUsuario = ?",
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
}

module.exports = UsuarioDAO;
