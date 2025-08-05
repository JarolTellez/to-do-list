class RefreshToken{
    constructor({idRefreshToken=null, idUsuario, token, fechaCreacion, fechaExpiracion, revocado }){
        this.idRefreshToken=idRefreshToken;
        this.idUsuario=idUsuario;
        this.token=token;
        this.fechaCreacion=fechaCreacion;
        this.fechaExpiracion=fechaExpiracion;
        this.revocado=revocado;
    }

    validar(){
        
    }

}
module.exports = RefreshToken;