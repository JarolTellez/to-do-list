class RefreshToken{
    constructor({idRefreshToken=null, idUsuario, token, hash, fechaCreacion, fechaExpiracion, revocado }){
        this.idRefreshToken=idRefreshToken;
        this.idUsuario=idUsuario;
        this.token=token;
        this.hash = hash;
        this.fechaCreacion=fechaCreacion;
        this.fechaExpiracion=fechaExpiracion;
        this.revocado=revocado;
    }

    validar(){
        
    }

}
module.exports = RefreshToken;