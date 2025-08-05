class RefreshTokenMapper{
    constructor(RefreshToken){
        this.RefreshToken = RefreshToken;
    }

    bdToDominio(refreshTokenBD){
        return new this.RefreshToken({
            idRefreshToken: refreshTokenBD.id_refresh_token,
            idUsuario: refreshTokenBD.id_usuario,
            token: refreshTokenBD.token,
            fechaCreacion: refreshTokenBD.fecha_creacion,
            fechaExpiracion: refreshTokenBD.fecha_expiracion,
            revocado: refreshTokenBD.revocado,

        });
    }


}

module.exports = RefreshTokenMapper;