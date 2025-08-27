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
      const dispositivoInfo = JSON.parse(req.get("Dispositivo-Info") || "{}");
      const ip = req.ip;
      const resultado = await this.servicioAuth.loginUsuario(nombreUsuario, contrasena, dispositivoInfo, ip);
      console.log("resultado: ", resultado);
      // const esProduccion = process.env.NODE_ENV === 'production';
      
    // Configurar cookies HttpOnly
    res.cookie('accessToken', resultado.tokenAcceso, {
      httpOnly: true,
      // secure: esProduccion,
     // sameSite: 'strict',
        secure: false,
        sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutos
    });

    res.cookie('refreshToken', resultado.refreshToken, {
      httpOnly: true,
     // secure: esProduccion,
     // sameSite: 'strict',
        secure: false,
        sameSite: 'lax',
      path: 'auth/renovar-refresh-token', // Solo accesible en endpoint de refresh
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    return res.status(200).json({
      status: "success",
      message: "Autenticación exitosa",
      data: {
        usuario: resultado.usuario,
        expiraEn: 900
      }
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
        const resultado = await this.servicioAuth.loginUsuario(nombreUsuario, contrasena);
     
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