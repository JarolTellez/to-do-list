class SesionMapper{
    constructor(Sesion){
        this.Sesion = Sesion;
    }

    bdToDominio(sesionBD){
        return new this.Sesion({
            idSesion: sesionBD.id_refresh_token,
            idUsuario: sesionBD.id_usuario,
            refreshTokenHash: sesionBD.refresh_token_hash,
            idDispositivo: sesionBD.id_dispositivo,
            userAgent: sesionBD.user_agent,
            ip: sesionBD.ip,
            fechaCreacion: sesionBD.fecha_creacion,
            fechaExpiracion: sesionBD.fecha_expiracion,
            activa: sesionBD.activa,

        });
    }


}

module.exports = SesionMapper;