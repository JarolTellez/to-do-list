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
         success: true,
        data: usuarioRespuesta
      });
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      return res.status(500).json({
         success: false,
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
  

    res.cookie('refreshToken', resultado.refreshToken, {
      httpOnly: true,
        secure: false,
        sameSite: 'lax',
     // path: 'auth/renovar-refresh-token', // Solo accesible en endpoint de refresh
     path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    return res.status(200).json({
      status: "success",
      message: "Autenticación exitosa",
      data: {
        usuario: resultado.usuario,
        accessToken: resultado.accessToken,
        expiraEn: 900
      }
    });
    } catch (error) {
      console.error("Error en login:", error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
         success: false,
        message: error.message || "Error interno del servidor"
      });
    }
  }
    
  async renovarAccessToken(req, res) {
    try {
       const refreshToken = req.cookies.refreshToken;
       if(!refreshToken){
             res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: "/"
            });
        return res.status(401).json({
          success: false,
          manesaje: "Refresh token no proporcionado"
        })
       }
        const resultado = await this.servicioAuth.renovarAccesToken(refreshToken);
    

      console.log("AUTH CONTROLLER TERMINADO SOLO FALTA EL RES.STATUS", resultado.usuario);
           console.log("ACCES TOKEN", resultado.accessToken);
    

      return res.status(200).json({
      success: true,
      message: "Access token renovado exitosamente",
      data: {
        usuario: resultado.usuario,
        accessToken: resultado.accessToken,
        expiraEn: 900
      }
    });
    } catch (error) {
       console.error('Error al renovar access token:', error);

        // Limpiar cookies en caso de error
          res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: "/"
        });


        const statusCode = error.statusCode || 401;
        res.status(statusCode).json({
            success: false,
            mensaje: error.message || 'Error al renovar token'
        });
    }
  }

  async renovarRefreshToken(req, res){

  }

}

module.exports = AuthController;