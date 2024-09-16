const ConexionBD = require('../config/conexionBD');

class UsuarioDAO {

  static async agregar(usuario) {
    const connection = await ConexionBD.conectar();
    try {
      const [result] = await connection.query(
        'INSERT INTO usuario (nombreUsuario, correo, contrasena) VALUES (?, ?, ?)',
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena]
      );
      usuario.idUsuario = result.insertId;
      return usuario;
    } catch (error) {
      console.error('Error al agregar', error);
      throw error;
    }
  }

  static async actualizar(usuario) {
    const connection = await ConexionBD.conectar();
    try {
      await connection.query(
        'UPDATE usuario SET nombreUsuario = ?, correo = ?, contrasena = ? WHERE idUsuario = ?',
        [usuario.nombreUsuario, usuario.correo, usuario.contrasena, usuario.idUsuario]
      );
      return usuario;
    } catch (error) {
      console.error('Error al actualizar', error);
      throw error;
    }
  }

  static async eliminar(idUsuario) {
    const connection = await ConexionBD.conectar();
    try {
      await connection.query('DELETE FROM usuario WHERE idUsuario = ?', [idUsuario]);
    } catch (error) {
      console.error('Error al eliminar', error);
      throw error;
    }
  }

  static async consultarTodos() {
    const connection = await ConexionBD.conectar();
    try {
      const [rows] = await connection.query('SELECT * FROM usuario');
      return rows;
    } catch (error) {
      console.error('Error al consultar todos los usuarios', error);
      throw error;
    }
  }

  static async consultarPorId(idUsuario) {
    const connection = await ConexionBD.conectar();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM usuario WHERE idUsuario = ?',
        [idUsuario]
      );
      return rows[0];
    } catch (error) {
      console.error('Error al consultar por id', error);
      throw error;
    }
  }

  static async consultarPorNombre(nombreUsuario) {
    const connection = await ConexionBD.conectar();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM usuario WHERE nombreUsuario = ?',
        [nombreUsuario]
      );
      return rows[0];
    } catch (error) {
      console.error('Error al consultar por nombre', error);
      throw error;
    }
  }


}

module.exports = UsuarioDAO;
