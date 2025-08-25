class SesionFabrica{
    constructor(Sesion){
        this.Sesion = Sesion;
    }

    crear(idUsuario, token, refreshTokenHash, userAgent, ip) {
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return new this.Sesion({
      idRefreshToken: null,
      idUsuario,
      token,
      refreshTokenHash,
      userAgent,
      ip,
      fechaCreacion,
      fechaExpiracion,
      revocado: false
    });
  }
}

module.exports = SesionFabrica;