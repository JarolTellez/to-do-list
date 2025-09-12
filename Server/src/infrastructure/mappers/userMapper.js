class UserMapper {
  constructor(User, UserResponseDTO, userTagMapper) {
    this.User = User;
    this.UserResponseDTO = UserResponseDTO;
    this.userTagMapper = userTagMapper;
  }

  requestToDomain(userRequest) {
    return new this.User({
      id: userRequest.id,
      userName: userRequest.userName,
      email: userRequest.email,
      password: userRequest.password,
      rol: userRequest.rol,
    });
  }

  dbToDomain(row) {
    return new this.User({
      id: row.user_id,
      userName: row.user_name,
      email: row.email,
      password: row.password,
      rol: row.rol,
      createdAt: row.user_created_at,
      userTags: [],
    });
  }

  dbToDomainWithTags(rows) {
    if (!rows.length === 0) return null;

    //unico usuario en todas las rows
    const user = this.dbToDomain(rows[0]);

    // filter evita null si no hay tags
    const userTags = rows
      .filter((r) => r.user_tag_id)
      .map((r) => this.userTagMapper.dbToDomain(r));


    userTags.forEach((userTag) => {
      user.addUserTag(userTag); 
    });
    return user;
  }

  dominioToRespuestaDTO(usuarioDominio) {
    return new this.UserResponseDTO({
      id: usuarioDominio.id,
      userName: usuarioDominio.userName,
      email: usuarioDominio.email,
      rol: usuarioDominio.rol,
    });
  }
}

module.exports = UserMapper;
