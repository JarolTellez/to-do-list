class UsuarioRespuestaDTO{
    constructor({idUsuario, nombreUsuario, correo, rol}){
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.correo = correo;
        this.rol = rol;
    }
}

module.exports = UsuarioRespuestaDTO;