class SesionFabrica{
    constructor(Sesion){
        this.Sesion = Sesion;
    }

    crear(idUsuario, token, refreshTokenHash, userAgent, ip, idDispositivo) {
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return new this.Sesion({
      idRefreshToken: null,
      idUsuario,
      token,
      refreshTokenHash,
      idDispositivo,
      userAgent,
      ip,
      fechaCreacion,
      fechaExpiracion,
      activo: true
    });
  }
}

module.exports = SesionFabrica;