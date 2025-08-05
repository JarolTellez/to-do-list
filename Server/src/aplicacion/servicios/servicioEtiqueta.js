class ServicioEtiqueta{
  constructor(etiquetaDAO, etiquetaMapper){
    this.etiquetaDAO = etiquetaDAO;
    
  }
  // async agregarEtiquetas(etiquetas, idTarea, idUsuario) {
  //   try {
  //     for (const etiqueta of etiquetas) {
  //       if (!etiqueta.hasOwnProperty("idEtiqueta")) {
  //         console.log("IDUSUARIO: ", idUsuario);
  //         const etiquetaNueva = new Etiqueta(null, etiqueta.nombre, etiqueta.descripcion, false, false, idUsuario, null);
  //         // etiquetaNueva.validar();

  //         const nuevaEtiqueta = await this.etiquetaDAO.agregarEtiqueta(etiquetaNueva);

  //         if (nuevaEtiqueta) {
  //         //  const tareaEtiqueta = new TareaEtiqueta(null, idTarea, nuevaEtiqueta.idEtiqueta);
  //           await this.agregarTareaEtiqueta(idTarea, nuevaEtiqueta.idEtiqueta );
  //         } else {
  //           const existente = await this.etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(etiqueta.nombre, idUsuario);
  //          // const tareaEtiqueta = new TareaEtiqueta(null, idTarea, existente.id_etiqueta);
  //           await this.agregarTareaEtiqueta(idTarea, existente.idEtiqueta);
  //         }
  //       } else {
  //        // const tareaEtiqueta = new TareaEtiqueta(null, idTarea, etiqueta.idEtiqueta);

  //         await this.agregarTareaEtiqueta(idTarea, etiqueta.idEtiqueta);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error en agregarEtiquetas: ", error);
  //     throw error;
  //   }
  // }

    // async agregarTareaEtiqueta(idTarea, idEtiqueta) {
  //   try {
  //     return await tareaEtiquetaDAO.agregarTareaEtiqueta(idTarea, idEtiqueta);
  //   } catch (error) {
  //     console.log("Error al agregar la TareaEtiqueta: ", error);
  //     throw error;
  //   }
  // }
  
  async agregarEtiqueta(etiqueta) {
    try {
      const existe = await this.etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(
        etiqueta.nombreEtiqueta, etiqueta.idUsuario
      );
     
      if (existe) {
       // return null;
       return existe;
      }

      return await this.etiquetaDAO.agregarEtiqueta(etiqueta);
    } catch (error) {
      console.log("Error al agregar la etiqueta: ", error);
      throw error;
    }
  }



  async consultarEtiquetasPorIdUsuario(idUsuario) {
    return await this.etiquetaDAO.consultarEtiquetaPorIdUsuario(idUsuario);
  }

  // async eliminarEtiquetas(etiquetas) {
  //   try {
  //     for (const etiqueta of etiquetas) {
  //       await  this.tareaEtiquetaDAO.eliminarTareaEtiqueta(etiqueta.idTareaEtiqueta);
  //     }
  //   } catch (error) {
  //     console.error("Error al eliminar tareaEtiqueta: ", error);
  //     throw error;
  //   }
  // }

  // async eliminarEtiquetasPorIdTarea(idTarea) {
  //   try {
  //     const etiquetas = await tareaEtiquetaDAO.consultarTareaEtiquetaPorIdTarea(idTarea);
  //     if (etiquetas && etiquetas.length > 0) {
  //       return await tareaEtiquetaDAO.eliminarTareaEtiquetaPorIdTarea(idTarea);
  //     }
  //     return 0;
  //   } catch (error) {
  //     console.error("Error al eliminar tareaEtiqueta: ", error);
  //     throw error;
  //   }
  // }

  async obtenerEtiquetaPorNombre(nombreEtiqueta) {
    try {
      return await this.etiquetaDAO.consultarEtiquetaPorNombre(nombreEtiqueta);
    } catch (error) {
      console.error("Error al obtener la etiqueta por nombre: ", error);
      throw error;
    }
  }
}

module.exports = ServicioEtiqueta;