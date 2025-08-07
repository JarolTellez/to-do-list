class UsuarioController {
  constructor({ servicioUsuario, usuarioMapper }) {
    this.servicioUsuario = servicioUsuario;
    this.usuarioMapper = usuarioMapper;
  }

  async agregarUsuario(req, res) {
    try {
      const usuario = this.usuarioMapper.requestToDominio(req.body);
      const usuarioAgregado = await this.servicioUsuario.registrarUsuario(usuario);
      
      return res.status(201).json({
        status: "success",
        data: usuarioAgregado
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
      const resultado = await this.servicioUsuario.loginUsuario(nombreUsuario, contrasena);
      
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
}

module.exports = UsuarioController;