const ConexionBD = require("../utils/conexionBD");

class UsuarioDAO {
  static async agregarUsuario(usuario) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
    try {
      const [resultado] = await connection.query(
        "INSERT INTO usuario (nombreUsuario, correo, contrasena) VALUES (?, ?, ?)",
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena]
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
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
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
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
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
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
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
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
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
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
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


static async consultarUsuarioPorNombreContrasena(nombreUsuario,contrasena) {
  const conexionBD = new ConexionBD();
  const connection = await conexionBD.conectar();
  try {
    const [rows] = await connection.query(
      "SELECT * FROM usuario WHERE nombreUsuario = ? AND contrasena = ?",
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