class ServicioRefreshToken{
    constructor(RefreshTokenDAO){
        this.RefreshTokenDAO = RefreshTokenDAO;

    }

    async registrarRefreshToken(refreshToken){
      
      return await this.RefreshTokenDAO.guardarRefreshToken(refreshToken);

    }
}

module.exports = ServicioRefreshToken;