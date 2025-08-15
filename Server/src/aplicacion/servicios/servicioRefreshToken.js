class ServicioRefreshToken{
    constructor(RefreshTokenDAO, JwtAuth){
        this.RefreshTokenDAO = RefreshTokenDAO;
        this.JwtAuth = JwtAuth;

    }

    async registrarRefreshToken(refreshToken){
        if (!refreshToken) {
      throw new Error('Faltan datos requeridos: userId o refreshToken');
    }
      try {
  
      await this.RefreshTokenDAO.revocarRefreshTokensIdUsuario(refreshToken.idUsuario);

      return await this.RefreshTokenDAO.guardarRefreshToken(refreshToken);
    } catch (error) {
      console.error('Error en registrarRefreshToken:', error);
      throw new Error('Error al registrar el refresh token');
    }

    }

     async renovarTokenAcceso(refreshToken){
        if (!refreshToken) {
      throw new Error('Faltan datos requeridos: refreshToken');
    }
      try {
        this.JwtAuth.verificarTokenRefresco(refreshToken);
  
      await this.RefreshTokenDAO.revocarRefreshTokensIdUsuario(refreshToken.idUsuario);

      return await this.RefreshTokenDAO.guardarRefreshToken(refreshToken);
    } catch (error) {
      console.error('Error en registrarRefreshToken:', error);
      throw new Error('Error al registrar el refresh token');
    }

    }
}

module.exports = ServicioRefreshToken;