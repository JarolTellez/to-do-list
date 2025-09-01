//const { use } = require("react");

class Sesion{
    constructor({idSesion=null, idUsuario, refreshTokenHash, idDispositivo, userAgent, ip, fechaCreacion, fechaExpiracion, activa }){
        this.idSesion=idSesion;
        this.idUsuario=idUsuario;
        this.refreshTokenHash=refreshTokenHash;
        this.idDispositivo=idDispositivo;
        this.userAgent=userAgent;
        this.ip=ip;
        this.fechaCreacion=fechaCreacion;
        this.fechaExpiracion=fechaExpiracion;
        this.activa=activa||true;
    }

    validar(){
        
    }

}
module.exports = Sesion;