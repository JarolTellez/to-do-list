class UsuarioMapper{
    
    constructor(Usuario, UsuarioRespuestaDTO){
        this.Usuario = Usuario;
        this.UsuarioRespuestaDTO = UsuarioRespuestaDTO;

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

    dominioToRespuestaDTO(usuarioDominio){
        return new this.UsuarioRespuestaDTO({
            idUsuario: usuarioDominio.idUsuario,
            nombreUsuario: usuarioDominio.nombreUsuario,
            correo: usuarioDominio.correo,
            rol: usuarioDominio.rol
        });

    }
}

module.exports = UsuarioMapper;