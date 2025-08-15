class AuthController {
  constructor({ servicioAuth, usuarioMapper }) {
    this.servicioAuth = servicioAuth;
    this.usuarioMapper = usuarioMapper;
  }

  async agregarUsuario(req, res) {
    try {
      const usuario = this.usuarioMapper.requestToDominio(req.body);
      const usuarioAgregado = await this.servicioAuth.registrarUsuario(usuario);
      const usuarioRespuesta = this.usuarioMapper.dominioToRespuestaDTO(usuarioAgregado);
      
      return res.status(201).json({
        status: "success",
        data: usuarioRespuesta
      });
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocurrió un error al intentar registrar el usuario.",
        error: error.message,
      });
    }
  }

  async loginUsuario(req, res) {
    try {
      const { nombreUsuario, contrasena } = req.body;
      const resultado = await this.servicioAuth.loginUsuario(nombreUsuario, contrasena);
      
      return res.status(200).json({
        status: "success",
        message: "Autenticación exitosa",
        data: resultado
      });
    } catch (error) {
      console.error("Error en login:", error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: "error",
        message: error.message || "Error interno del servidor"
      });
    }
  }
    
  async renovarTokenAcceso(req, res) {
    try {
      const { refreshToken } = req.body;
     
      return res.status(200).json({
        status: "success",
        message: "Autenticación exitosa",
        data: resultado
      });
    } catch (error) {
      console.error("Error en renovar token de acceso:", error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: "error",
        message: error.message || "Error interno del servidor"
      });
    }
  }


}

module.exports = AuthController;