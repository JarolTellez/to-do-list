class RefreshTokenDAO{
   constructor(refreshTokenMapper, conexionBD) {
    this.refreshTokenMapper = refreshTokenMapper;
    this.conexionBD = conexionBD;
  }

    async guardarRefreshToken(refreshToken) {
    const connection = await this.conexionBD.conectar();
    try {
      const [nuevoRefreshToken] = await connection.query(
        "INSERT INTO refresh_tokens ( id_usuario, hash, fecha_creacion, fecha_expiracion, revocado) VALUES (?,?,?,?,?)",
        [refreshToken.idUsuario, refreshToken.hash, refreshToken.fechaCreacion, refreshToken.fechaExpiracion, refreshToken.revocado ]
      );
      refreshToken.idRefreshToken = nuevoRefreshToken.insertId;

      return refreshToken;
    } catch (error) {
      console.log("Error al agregar el refresh token: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async revocarRefreshTokensIdUsuario(idUsuario){
    const connection = await this.conexionBD.conectar();
    try {
    await connection.query(
        "DELETE FROM refresh_tokens WHERE id_usuario = ?",
        [idUsuario]
      );
    } catch (error) {
      console.log("Error al eliminar refresh token: ", error);
      throw error;
    } finally {
      connection.release();
    }

  }

  
  async consultarRefreshTokenIdUsuario(idUsuario){
    const connection = await this.conexionBD.conectar();
    try {
      const [nuevoRefreshToken] = await connection.query(
        "",
        [idUsuario]
      );
    } catch (error) {
      console.log("Error al eliminar refresh token: ", error);
      throw error;
    } finally {
      connection.release();
    }

  }
}

module.exports= RefreshTokenDAO;