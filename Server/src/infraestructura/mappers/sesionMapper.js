class SesionMapper{
    constructor(Sesion){
        this.Sesion = Sesion;
    }

    bdToDominio(sesionBD){
        return new this.Sesion({
            idRefreshToken: sesionBD.id_refresh_token,
            idUsuario: sesionBD.id_usuario,
            token: sesionBD.token||null,
            refreshTokenHash: sesionBD.refresh_token_ash,
            userAgent: sesionBD.user_agent,
            ip: sesionBD.ip,
            fechaCreacion: sesionBD.fecha_creacion,
            fechaExpiracion: sesionBD.fecha_expiracion,
            revocado: sesionBD.revocado,

        });
    }


}

module.exports = SesionMapper;