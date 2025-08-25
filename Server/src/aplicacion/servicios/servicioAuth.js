const bcrypt = require("bcryptjs");

class ServicioAuth{
   constructor(Usuario, SesionFabrica,servicioSesion, UsuarioDAO, jwtAuth, bcrypt) {
    this.Usuario = Usuario;
    this.SesionFabrica = SesionFabrica;
    this.servicioSesion = servicioSesion;
    this.UsuarioDAO = UsuarioDAO;
    this.jwtAuth = jwtAuth;
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

   async loginUsuario( nombreUsuario, contrasena, infoSesion ) {
      const { userAgent, ip } = infoSesion;
    //Se buscar el usuario por nombreUsuario 
    const usuarioEncontrado = await this.UsuarioDAO.consultarUsuarioPorNombreContrasena(nombreUsuario, contrasena);

    if (!usuarioEncontrado) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const tokenAcceso = this.jwtAuth.generarTokenAcceso(usuarioEncontrado.idUsuario, usuarioEncontrado.rol);
    const {refreshToken, refreshTokenHash}= this.jwtAuth.generarRefreshToken(usuarioEncontrado.idUsuario);

  const entidadSesion=this.SesionFabrica.crear(usuarioEncontrado.idUsuario, refreshToken, refreshTokenHash, userAgent, ip );
  

    await this.servicioSesion.registrarSesion(entidadSesion);

    return {
      usuario: usuarioEncontrado,
      tokenAcceso,
      refreshToken,
      expiraEn: 900 // 15 minutos en segundos
    };
  }

  async renovarTokenAcceso(refreshToken){

  }
}

module.exports = ServicioAuth;
