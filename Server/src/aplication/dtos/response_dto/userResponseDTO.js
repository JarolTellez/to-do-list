class UserResponseDTO{
    constructor({id, userName, email, rol}){
        this.id = id;
        this.userName = userName;
        this.email = email;
        this.rol = rol;
    }
}

module.exports = UserResponseDTO;