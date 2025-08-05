class UsuarioMapper{
    
    constructor(Usuario){
        this.Usuario = Usuario;
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