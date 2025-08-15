class RefreshTokenFabrica{
    constructor(RefreshToken){
        this.RefreshToken = RefreshToken;
    }

    crear(idUsuario, token, hash) {
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return new this.RefreshToken({
      idRefreshToken: null,
      idUsuario,
      token,
      hash,
      fechaCreacion,
      fechaExpiracion,
      revocado: false
    });
  }
}

module.exports = RefreshTokenFabrica;