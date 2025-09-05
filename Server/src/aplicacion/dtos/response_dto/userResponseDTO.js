class UserResponseDTO{
    constructor({userId, userName, email, rol}){
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.rol = rol;
    }
}

module.exports = UserResponseDTO;