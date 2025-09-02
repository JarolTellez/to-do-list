const bcrypt = require("bcryptjs");

class ServicioAuth{
   constructor(Usuario, SesionFabrica,servicioSesion, UsuarioDAO, jwtAuth, bcrypt, crypto) {
    this.Usuario = Usuario;
    this.SesionFabrica = SesionFabrica;
    this.servicioSesion = servicioSesion;
    this.UsuarioDAO = UsuarioDAO;
    this.jwtAuth = jwtAuth;
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.MAX_SESIONES = parseInt(process.env.MAX_SESIONES_ACTIVAS) || 5;
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


async loginUsuario(refreshTokenExistente, nombreUsuario, contrasena, dispositivoInfo, ip) {
    // Validar parámetros requeridos
    if (!nombreUsuario || !contrasena) {
        const error = new Error("Nombre de usuario y contraseña son requeridos");
        error.statusCode = 400;
        throw error;
    }

    console.log('Verificando credenciales para usuario:', nombreUsuario);
    
    // Verificar el usuario
    const usuario = await this.UsuarioDAO.consultarUsuarioPorNombreContrasena(
        nombreUsuario,
        contrasena
    );

    if (!usuario) {
        console.log('Usuario no encontrado:', nombreUsuario);
        const error = new Error("Credenciales inválidas");
        error.statusCode = 401;
        throw error;
    }

    console.log('Usuario autenticado:', usuario.idUsuario);

    // Gestionar límite de sesiones
    await this.servicioSesion.gestionarLimiteDeSesiones(
        usuario.idUsuario,
        this.MAX_SESIONES
    );

    let refreshTokenFinal = null;
    let refreshTokenHash = null;

    // Si hay refresh token existente, validarlo
    if (refreshTokenExistente) {
        console.log('Validando refresh token existente');
        
        try {
            // Verificar firma JWT del refresh token
            const decodificado = this.jwtAuth.verificarRefreshToken(refreshTokenExistente);
            
            // Verificar que el token pertenece al usuario que está haciendo login
            if (decodificado.idUsuario !== usuario.idUsuario) {
                console.log('Refresh token no corresponde al usuario');
                throw new Error("Token inválido");
            }

            // Verificar sesión en BD
            refreshTokenHash = this.jwtAuth.generarHash(refreshTokenExistente);
            const sesionValida = await this.servicioSesion.verificarSesionValida(
                usuario.idUsuario, 
                refreshTokenHash
            );
            console.log("error",sesionValida);

            console.log('Refresh token validado exitosamente');
            
        } catch (error) {
            console.log('Refresh token inválido:', error.message);
            // Si el token es inválido, continuar para generar uno nuevo
            refreshTokenExistente = null;
        }
    }

    // Generar access token
    const accessToken = this.jwtAuth.generarAccessToken(
        usuario.idUsuario,
        usuario.rol
    );

    // Generar nuevo refresh token si no hay uno válido
    if (!refreshTokenExistente) {
        console.log('Generando nuevo refresh token');
        
        const { refreshToken, refreshTokenHash: newHash } = this.jwtAuth.generarRefreshToken(
            usuario.idUsuario
        );

        refreshTokenFinal = refreshToken;
        refreshTokenHash = newHash;

        // Crear deviceId
        const dispositivo = `
            ${dispositivoInfo.userAgent || 'Unknown'}
            ${dispositivoInfo.screenWidth || 'Unknown'}
            ${dispositivoInfo.screenHeight || 'Unknown'}
            ${dispositivoInfo.timezone || 'Unknown'}
            ${dispositivoInfo.language || 'Unknown'}
            ${dispositivoInfo.hardwareConcurrency || 'Unknown'}
            ${usuario.idUsuario}
        `;

        const dispositivoId = this.crypto
            .createHash("sha256")
            .update(dispositivo)
            .digest("hex");

        // Crear y registrar la sesión
        const entidadSesion = this.SesionFabrica.crear(
            usuario.idUsuario,
            refreshTokenHash, 
            dispositivoInfo.userAgent || 'Unknown',
            ip,
            dispositivoId,
            true
        );

        await this.servicioSesion.registrarSesion(entidadSesion);
        console.log('Nueva sesión registrada');
    }

    return {
        usuario: usuario,
        accessToken: accessToken,
        refreshToken: refreshTokenFinal, 
        expiraEn: process.env.EXP_REFRESH_TOKEN
    };
}



async renovarAccesToken(refreshToken) {
    if (!refreshToken) {
        throw this.crearErrorPersonalizado('Refresh Token no proporcionado', 400, 'REFRESH_MISSING');
    }

    let decoded;
    try {
        decoded = this.jwtAuth.verificarRefreshToken(refreshToken);
    } catch (error) {
        return await this.manejarErrorVerificacionToken(error, refreshToken);
    }

    try {
        const usuario = await this.UsuarioDAO.consultarUsuarioPorId(decoded.idUsuario);
        if (!usuario) {
            throw this.crearErrorPersonalizado('Usuario no encontrado', 404, 'USER_NOT_FOUND');
        }

        const refreshTokenHashRecibido = this.crypto.createHash('sha256').update(refreshToken).digest('hex');
        const sesionValida = await this.servicioSesion.verificarSesionValida(usuario.idUsuario, refreshTokenHashRecibido);
        
        if (!sesionValida) {
            throw this.crearErrorPersonalizado('Sesión no válida', 401, 'INVALID_SESSION');
        }

        if (new Date() > new Date(sesionValida.fechaExpiracion)) {
            await this.servicioSesion.desactivarSesion(sesionValida.idSesion);
            throw this.crearErrorPersonalizado('Sesión expirada', 401, 'SESSION_EXPIRED');
        }

        const nuevoAccessToken = this.jwtAuth.generarAccessToken(usuario.idUsuario, usuario.rol);

        return {
            accessToken: nuevoAccessToken,
            usuario: usuario,
        };

    } catch (error) {
        if (error.tipo) {
            throw error;
        }
        throw this.crearErrorPersonalizado('Error interno del servidor', 500, 'INTERNAL_ERROR');
    }
}


async manejarErrorVerificacionToken(error, refreshToken) {
    try {
        const decoded = this.jwtAuth.decodificarToken(refreshToken);
        const usuario = await this.UsuarioDAO.consultarUsuarioPorId(decoded.idUsuario);
        
        if (usuario) {
            const refreshTokenHashRecibido = this.crypto.createHash('sha256').update(refreshToken).digest('hex');
            const sesion = await this.servicioSesion.verificarSesionValida(usuario.idUsuario, refreshTokenHashRecibido);
            
            if (sesion) {
                await this.servicioSesion.desactivarSesion(sesion.idSesion);
            }
        }
    } catch (innerError) {
        console.error('Error al limpiar sesión inválida:', innerError);
    }

    if (error.message === 'Refresh token expirado') {
        throw this.crearErrorPersonalizado('Refresh token expirado', 401, 'REFRESH_EXPIRED');
    }
    
    if (error.message === 'Refresh token inválido') {
        throw this.crearErrorPersonalizado('Refresh token inválido', 401, 'REFRESH_INVALID');
    }

    throw this.crearErrorPersonalizado('Token inválido', 401, 'TOKEN_INVALID');
}

crearErrorPersonalizado(mensaje, statusCode, tipo) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.tipo = tipo;
    return error;
}



}

module.exports = ServicioAuth;
