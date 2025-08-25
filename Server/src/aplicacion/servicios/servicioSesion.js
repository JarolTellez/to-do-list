class ServicioSesion{
    constructor(SesionDAO, JwtAuth){
        this.SesionDAO = SesionDAO;
        this.JwtAuth = JwtAuth;

    }

    async registrarSesion(sesion){
        if (!sesion) {
      throw new Error('Faltan datos requeridos: userId o refreshToken');
    }
      try {
  
     // await this.SesionDAO.revocarRefreshTokensIdUsuario(sesion.idUsuario);

      return await this.SesionDAO.guardarSesion(sesion);
    } catch (error) {
      console.error('Error en registrar la sesion:', error);
      throw new Error('Error al registrar la sesion');
    }

    }

     async renovarTokenAcceso(refreshToken){
      
    }
}

module.exports = ServicioSesion;