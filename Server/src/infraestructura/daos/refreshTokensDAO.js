//const ConexionBD = require("../utils/conexionBD");

class RefreshTokensDAO{
   constructor(refreshTokenMapper, conexionBD) {
    this.refreshTokenMapper = refreshTokenMapper;
    this.conexionBD = conexionBD;
  }

     async guardarRefreshToken(refreshToken) {
   // const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();
    try {
      const [nuevoRefreshToken] = await connection.query(
        "INSERT INTO refresh_tokens ( id_usuario, token, fecha_creacion, fecha_expiracion, revocado) VALUES (?,?,?,?,?)",
        [refreshToken.idUsuario, refreshToken.token, refreshToken.fechaCreacion, refreshToken.fechaExpiracion, refreshToken.revocado ]
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
}

module.exports= RefreshTokensDAO;