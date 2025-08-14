const bcrypt = require("bcryptjs");

class ServicioUsuario{
   constructor(Usuario, RefreshTokenFabrica,servicioRefreshToken, UsuarioDAO, JwtAuth, bcrypt) {
    this.Usuario = Usuario;
    this.RefreshTokenFabrica = RefreshTokenFabrica;
    this.servicioRefreshToken = servicioRefreshToken;
    this.UsuarioDAO = UsuarioDAO;
    this.JwtAuth = JwtAuth;
    this.bcrypt = bcrypt;

   }

   async registrarUsuario(usuario) {
    const existe = await this.UsuarioDAO.consultarUsuarioPorNombre(usuario.nombreUsuario);
    if (existe) {
      const error = new Error("El usuario ya existe");
      error.statusCode = 409;
      throw error;
    }

    const contrasenaEncriptada = await this.bcrypt.hash(usuario.contrasena, 10);
    usuario.contrasena=contrasenaEncriptada;
    // const usuario = new this.Usuario(null, nombreUsuario, correo, contrasenaEncriptada);
    usuario.validar();
    const usuarioAgregado = await this.UsuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    return usuarioAgregado;
  }

   async loginUsuario( nombreUsuario, contrasena ) {
    //Se buscar el usuario por nombreUsuario 
    const usuarioEncontrado = await this.UsuarioDAO.consultarUsuarioPorNombreContrasena(nombreUsuario, contrasena);

    if (!usuarioEncontrado) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const tokenAcceso = this.JwtAuth.generarTokenAcceso(usuarioEncontrado.idUsuario, usuarioEncontrado.rol);
    const refreshToken= this.JwtAuth.generarRefreshToken(usuarioEncontrado.idUsuario);

  const entidadRefreshToken=this.RefreshTokenFabrica.crear(usuarioEncontrado.idUsuario, refreshToken);

    await this.servicioRefreshToken.registrarRefreshToken(entidadRefreshToken);

    return {
      usuario: usuarioEncontrado,
      tokenAcceso,
      refreshToken,
      expiraEn: 900 // 15 minutos en segundos
    };
  }
}

module.exports = ServicioUsuario;
