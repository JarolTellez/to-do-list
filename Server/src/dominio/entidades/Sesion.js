//const { use } = require("react");

class Sesion{
    constructor({idSesion=null, idUsuario, token, refreshTokenHash, idDispositivo, userAgent, ip, fechaCreacion, fechaExpiracion, activo }){
        this.idSesion=idSesion;
        this.idUsuario=idUsuario;
        this.token=token;
        this.refreshTokenHash=refreshTokenHash;
        this.idDispositivo=idDispositivo;
        this.userAgent=userAgent;
        this.ip=ip;
        this.fechaCreacion=fechaCreacion;
        this.fechaExpiracion=fechaExpiracion;
        this.activo=activo;
    }

    validar(){
        
    }

}
module.exports = Sesion;