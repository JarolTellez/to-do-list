class SesionMapper{
    constructor(Sesion){
        this.Sesion = Sesion;
    }
// CORREJIR RETURN ERROR
    bdToDominio(sesionBD){
     if(!sesionBD){
        return null;
     }
        return new this.Sesion({
            idSesion: sesionBD.id_sesion,
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