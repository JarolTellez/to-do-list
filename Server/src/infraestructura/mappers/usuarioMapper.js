class UsuarioMapper{
    
    constructor(Usuario){
        this.Usuario = Usuario;
    }

    requestToDominio(usuarioRequest){
        return new this.Usuario({
             idUsuario: usuarioRequest.idUsuario,
            nombreUsuario: usuarioRequest.nombreUsuario,
            correo: usuarioRequest.correo,
            contrasena: usuarioRequest.contrasena,
            rol: usuarioRequest.rol,

        });

    }

    bdToDominio(usuarioBD){
        return new this.Usuario({
            idUsuario: usuarioBD.id_usuario,
            nombreUsuario: usuarioBD.nombre_usuario,
            correo: usuarioBD.correo,
            contrasena: usuarioBD.contrasena,
            rol: usuarioBD.rol,
        });

    }
}

module.exports = UsuarioMapper;