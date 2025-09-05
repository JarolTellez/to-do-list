class SessionFactory{
    constructor(Session){
        this.Session = Session;
    }

    crear(idUsuario, refreshTokenHash, userAgent, ip, idDispositivo, activa) {
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return new this.Session({
      idRefreshToken: null,
      idUsuario,
      refreshTokenHash,
      idDispositivo,
      userAgent,
      ip,
      fechaCreacion,
      fechaExpiracion,
      activa: activa
    });
  }
}

module.exports = SessionFactory;