class ServicioSesion{
    constructor(SesionDAO, JwtAuth){
        this.SesionDAO = SesionDAO;
        this.JwtAuth = JwtAuth;

    }


    async registrarSesion(sesion) {
  if (!sesion || !sesion.idUsuario || !sesion.refreshTokenHash) {
    throw new Error('Faltan datos requeridos: idUsuario o refreshTokenHash');
  }

  try {
    // Desactivar sesiónes existentes del mismo dispositivo
    await this.SesionDAO.desactivarPorIdUsuarioIdDispositivo(
      sesion.idUsuario, 
      sesion.idDispositivo
    );

    // Guardar nueva sesión
    return await this.SesionDAO.guardarSesion(sesion);
  } catch (error) {
    console.error('Error al registrar la sesión:', error);
    throw new Error('Error al registrar la sesión: ' + error.message);
  }
}

async gestionarLimiteDeSesiones(idUsuario, maximoSesiones) {
  if (!idUsuario) {
    throw new Error('Faltan datos requeridos: idUsuario');
  }

  try {
    const sesionesActivas = await this.SesionDAO.consultarSesionesActivasPorIdUsuario(idUsuario);
    
    if (sesionesActivas >= maximoSesiones) {
      const eliminada = await this.SesionDAO.desactivarSesionMasAntigua(idUsuario);
      
      if (!eliminada) {
        throw new Error('No se pudo liberar espacio de sesiones');
      }
      
      return { eliminada: true, mensaje: 'Sesión más antigua eliminada' };
    }
    
    return { eliminada: false, mensaje: 'Dentro del límite' };
  } catch (error) {
    console.error('Error al gestionar límite de sesiones:', error);
    throw new Error('Error al gestionar límite de sesiones: ' + error.message);
  }
}
     async renovarTokenAcceso(refreshToken){
      
    }
}

module.exports = ServicioSesion;