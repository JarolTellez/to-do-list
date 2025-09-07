class UserMapper{
    
    constructor(User, UserResponseDTO){
        this.User = User;
        this.UserResponseDTO = UserResponseDTO;

    }

    requestToDomain(userRequest){
        return new this.User({
            id: userRequest.id,
            userName: userRequest.userName,
            email: userRequest.email,
            password: userRequest.password,
            rol: userRequest.rol,
        });

    }

    dbToDomain(dbUser){
        return new this.User({
            id: dbUser.id,
            userName: dbUser.user_name,
            email: dbUser.email,
            password: dbUser.password,
            rol: dbUser.rol,
        });

    }

    dominioToRespuestaDTO(usuarioDominio){
        return new this.UserResponseDTO({
            id: usuarioDominio.id,
            userName: usuarioDominio.userName,
            email: usuarioDominio.email,
            rol: usuarioDominio.rol
        });

    }
}

module.exports = UserMapper;