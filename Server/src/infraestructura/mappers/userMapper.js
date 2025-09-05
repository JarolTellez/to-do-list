class UserMapper{
    
    constructor(User, UserResponseDTO){
        this.User = User;
        this.UserResponseDTO = UserResponseDTO;

    }

    requestToDominio(userRequest){
        return new this.User({
             userId: userRequest.userId,
            userName: userRequest.userName,
            email: userRequest.email,
            password: userRequest.password,
            rol: userRequest.rol,

        });

    }

    bdToDominio(usuarioBD){
        return new this.User({
            userId: usuarioBD.id_usuario,
            userName: usuarioBD.nombre_usuario,
            email: usuarioBD.email,
            password: usuarioBD.password,
            rol: usuarioBD.rol,
        });

    }

    dominioToRespuestaDTO(usuarioDominio){
        return new this.UserResponseDTO({
            userId: usuarioDominio.userId,
            userName: usuarioDominio.userName,
            email: usuarioDominio.email,
            rol: usuarioDominio.rol
        });

    }
}

module.exports = UserMapper;