class AuthController {
  constructor({ authService, userMapper, AuthenticationError }) {
    this.authService = authService;
    this.userMapper = userMapper;
    this.AuthenticationError = AuthenticationError;
  }
// CAMBIAR A QUE CONVIERTA A UN DTO DE REQUEST- CONTROLLER NO MAPEARA A DOMINIO DE ESO SE ENCARGARAN LOS SERVICIOS
  async registerUser(req, res, next) {
    try {
      const user = this.userMapper.requestToDomain(req.body);
      const addedUser = await this.authService.createUser(user);
      const responseUser = this.userMapper.dominioToRespuestaDTO(addedUser);
      
      return res.status(201).json({
         success: true,
        data: responseUser
      });
    } catch (error) {
      next(error);
    }
  }

    async login(req, res, next) {
    try {
        const { userName, password } = req.body;
        const deviceInfo = JSON.parse(req.get('Dispositivo-Info') || '{}');
        const ip = req.ip;
        const refreshTokenExistente = req.cookies.refreshToken;
        
        const result = await this.authService.loginUser(
            refreshTokenExistente, 
            userName, 
            password, 
            deviceInfo, 
            ip
        );

        // Solo se establece cookie si se genero un nuevo refresh token
        if (result.refreshToken) {
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            console.log('Nuevo refresh token establecido en cookies');
        } else {
            console.log('Usando refresh token existente');
        }

        return res.status(200).json({
            status: 'success',
            message: 'Autenticación exitosa',
            data: {
                user: result.user,
                accessToken: result.accessToken,
                expiraEn: result.expiraEn
            }
        });

    } catch (error) {
        // console.error('Error en login:', error.message);
        // const statusCode = error.statusCode || 500;
        
        // Limpiar cookies en caso de error
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });
        next(error);

        // return res.status(statusCode).json({
        //     success: false,
        //     message: error.message || 'Error interno del servidor'
        // });
    }
}

async logOut(req, res, next) {
  try {
    const refreshTokenExistente = req.cookies.refreshToken;

    if (!refreshTokenExistente) {
      throw new this.AuthenticationError('No hay token de refresh presente');
    }

  
    const result = await this.authService.logOutSession(refreshTokenExistente);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

   
    return res.status(200).json({
      status: 'success',
      message: 'Logout exitoso',
      data: result 
    });

  } catch (error) {
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    
    next(error); 
  }
}


async refreshAccessToken(req, res, next) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            console.log('Renovación fallida: No hay refresh token');
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/'
            });

            return res.status(401).json({
                success: false,
                message: 'Refresh token no proporcionado',
                tipo: 'NO_REFRESH_TOKEN'
            });
        }
        const result = await this.authService.refreshAccessToken(refreshToken);
        return res.status(200).json({
            success: true,
            message: 'Access token renovado exitosamente',
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    rol: result.user.rol
                },
                accessToken: result.accessToken,
                expiraEn: process.env.JWT_ACCESS_EXPIRE_IN || 900
            }
        });

    } catch (error) {
        // console.error('Error renovando token:', error.message);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });
        next(error);
        // const statusCode = error.statusCode || 401;
        
        // return res.status(statusCode).json({
        //     success: false,
        //     message: error.message || 'Error al renovar token',
        //     tipo: error.tipo || 'ERROR_DESCONOCIDO'
        // });
    }
}


  async refreshRefreshToken(req, res, next){

  }

}

module.exports = AuthController;