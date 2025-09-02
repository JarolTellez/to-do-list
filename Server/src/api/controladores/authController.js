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
        const refreshTokenExistente = req.cookies.refreshToken;

        console.log('Iniciando login para usuario:', nombreUsuario);
        
        const resultado = await this.servicioAuth.loginUsuario(
            refreshTokenExistente, 
            nombreUsuario, 
            contrasena, 
            dispositivoInfo, 
            ip
        );

        // Solo se establece cookie si se genero un nuevo refresh token
        if (resultado.refreshToken) {
            res.cookie('refreshToken', resultado.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            console.log('Nuevo refresh token establecido en cookies');
        } else {
            console.log('Usando refresh token existente');
        }

        return res.status(200).json({
            status: "success",
            message: "Autenticación exitosa",
            data: {
                usuario: resultado.usuario,
                accessToken: resultado.accessToken,
                expiraEn: resultado.expiraEn
            }
        });

    } catch (error) {
        console.error("Error en login:", error.message);
        const statusCode = error.statusCode || 500;
        
        // Limpiar cookies en caso de error
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: "/"
        });

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Error interno del servidor"
        });
    }
}

async renovarAccessToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            console.log('Renovación fallida: No hay refresh token');
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: "/"
            });

            return res.status(401).json({
                success: false,
                mensaje: "Refresh token no proporcionado",
                tipo: "NO_REFRESH_TOKEN"
            });
        }

        const resultado = await this.servicioAuth.renovarAccesToken(refreshToken);
        console.log('Token renovado para usuario:', resultado.usuario.idUsuario);

        return res.status(200).json({
            success: true,
            message: "Access token renovado exitosamente",
            data: {
                usuario: {
                    id: resultado.usuario.idUsuario,
                    email: resultado.usuario.email,
                    rol: resultado.usuario.rol
                },
                accessToken: resultado.accessToken,
                expiraEn: process.env.JWT_ACCESS_EXPIRE_IN || 900
            }
        });

    } catch (error) {
        console.error('Error renovando token:', error.message);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: "/"
        });

        const statusCode = error.statusCode || 401;
        
        return res.status(statusCode).json({
            success: false,
            mensaje: error.message || 'Error al renovar token',
            tipo: error.tipo || 'ERROR_DESCONOCIDO'
        });
    }
}


  async renovarRefreshToken(req, res){

  }

}

module.exports = AuthController;