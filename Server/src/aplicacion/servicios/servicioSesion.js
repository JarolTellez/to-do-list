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
  
        // Desactiva la sesion correspondiente al id del dispositivo que se asigno al crearlo y al id del usuario
      await this.SesionDAO.desactivarPorIdUsuarioIdDispositivo(sesion.idUsuario, sesion.idDispositivo)

      return await this.SesionDAO.guardarSesion(sesion);
    } catch (error) {
      console.error('Error en registrar la sesion:', error);
      throw new Error('Error al registrar la sesion');
    }

    }

      async gestionarLimiteDeSesiones(idUsuario, maximoSesiones){
        if (!idUsuario) {
      throw new Error('Faltan datos requeridos: idUsuario');
    }
      try {
      const sesionesActivas= await this.SesionDAO.consultarSesionesActivasPorIdUsuario(idUsuario);
        if (sesionesActivas >= maximoSesiones) {
      // Opción 1: Eliminar directamente
      const eliminada = await this.SesionDAO.desactivarSesionMasAntigua(idUsuario);
      
      if (!eliminada) {
        throw new Error('No se pudo eliminar la sesión más antigua');
      }
      
      return { eliminada: true, mensaje: 'Sesión más antigua eliminada' };
    }
    
    return { eliminada: false, mensaje: 'Dentro del límite' };
    } catch (error) {
      console.error('Error en registrar la sesion:', error);
      throw new Error('Error al registrar la sesion');
    }

    }

     async renovarTokenAcceso(refreshToken){
      
    }
}

module.exports = ServicioSesion;