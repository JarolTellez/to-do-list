const Tarea = require("../../dominio/entidades/Tarea");
const Etiqueta = require("../../dominio/entidades/Etiqueta");


//const etiquetaServicio = require("../servicios/servicioEtiqueta");

class ServicioTarea {
   constructor(tareaDAO, tareaEtiquetaDAO, servicioEtiqueta) {
    this.tareaDAO =  tareaDAO
    this.tareaEtiquetaDAO = tareaEtiquetaDAO;
    this.servicioEtiqueta = servicioEtiqueta;
  
   }
 
  // async agregarTarea(tarea) {
  //   // const {
  //   //   nombre,
  //   //   descripcion,
  //   //   fechaProgramada,
  //   //   fechaCreacion,
  //   //   fechaUltimaActualizacion,
  //   //   completada,
  //   //   idUsuario,
  //   //   prioridad,
  //   //   etiquetas,
  //   // } = tarea;

  //   // const etiquetasAgregar = etiquetas.map(etiqueta =>{
  //   //   try {
  //   //     return new Etiqueta(
  //   //       etiqueta.idEtiqueta,
  //   //       etiqueta.nombre,
  //   //       idUsuario
  //   //     );
        
  //   //   } catch (error) {
  //   //      throw {
  //   //       etiqueta: etiqueta,
  //   //       error: JSON.parse(error.message) 
  //   //     };

  //   //   }
  //   // })
  //   // const tarea = new Tarea(
  //   //   null,
  //   //   nombre,
  //   //   descripcion,
  //   //   fechaProgramada,
  //   //   fechaCreacion,
  //   //   fechaUltimaActualizacion,
  //   //   completada,
  //   //   idUsuario,
  //   //   prioridad,
  //   //   etiquetasAgregar
  //   // );

  //   //tarea.validar();
  //   const tareaAgregada = await tareasDAO.agregarTarea(tarea);

  //   if (etiquetas && etiquetas.length > 0) {
  //     await etiquetaService.agregarEtiquetas(etiquetas, tareaAgregada.idTarea, idUsuario);
  //   }

  //   const tareaConEtiquetas = await tareasDAO.consultarTareasPorIdTarea(tareaAgregada.idTarea);
  //   return this.procesarTareasConEtiquetas(tareaConEtiquetas)[0];
  // }

  //  async agregarTarea(tarea) {
    
  //  // const tareaAgregada = await tareasDAO.agregarTarea(tarea);
  //  const tareaAgregada = await this.tareaDAO.agregarTarea(tarea);
  //   if (tarea.etiquetas && tarea.etiquetas.length > 0) {
  //       //CAMBIAR A QUE LLAME A DAO
  //       //console.log("TAREA: ")

        
  //     await this.servicioEtiqueta.agregarEtiquetas(
  //       tarea.etiquetas,
  //       tareaAgregada.idTarea,
  //       tarea.idUsuario
  //     );
  //   }

  //   // const tareaConEtiquetas = await tareasDAO.consultarTareasPorIdTarea(
  //   //   tareaAgregada.idTarea
  //   // );
  //   return tarea;
  
   
  //  // return this.procesarTareasConEtiquetas(tareaConEtiquetas)[0];
  // //  return tareaAgregada;
  // }
async agregarTarea(tarea) {

  const tareaAgregada = await this.tareaDAO.agregarTarea(tarea);

  if (tarea.etiquetas && tarea.etiquetas.length > 0) {
    for (const etiqueta of tarea.etiquetas) {
      let idEtiqueta;

      if (etiqueta.idEtiqueta) {
        // Ya viene con ID
        idEtiqueta = etiqueta.idEtiqueta;
      } else {
        // Crear objeto Etiqueta y dejar que el servicio maneje si ya existe o no
        const etiquetaNueva = new Etiqueta(
          null,
          etiqueta.nombre,
          etiqueta.descripcion,
          false,
          false,
          tarea.idUsuario,
          null
        );

        const etiquetaGuardada = await this.servicioEtiqueta.agregarEtiqueta(etiquetaNueva);
        idEtiqueta = etiquetaGuardada.idEtiqueta;
      }

      await this.agregarTareaEtiqueta(tareaAgregada.idTarea, idEtiqueta);
    }
  }

  return tareaAgregada;
}



  async agregarTareaEtiqueta(idTarea, idEtiqueta) {
    try {
      return await this.tareaEtiquetaDAO.agregarTareaEtiqueta(idTarea, idEtiqueta);
    } catch (error) {
      console.log("Error al agregar la TareaEtiqueta: ", error);
      throw error;
    }
  }

  async eliminarTarea(idTarea, idUsuario) {
    const tareaExistente = await this.tareaDAO.consultarTareaPorIdTareaUsuario(idTarea, idUsuario);

    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con id ${idTarea}`);
    }

    await this.servicioEtiqueta.eliminarEtiquetasPorIdTarea(idTarea);
    const eliminada = await this.tareaDAO.eliminarTarea(idTarea);

    if (eliminada <= 0) {
      throw new Error("No se pudo eliminar la tarea");
    }
  }

  async actualizarTarea(tarea) {
    // const {
    //   idTarea,
    //   nombre,
    //   descripcion,
    //   fechaProgramada,
    //   fechaUltimaActualizacion,
    //   idUsuario,
    //   prioridad,
    //   etiquetasAnteriores,
    //   etiquetasNuevas
    // } = tareaData;

    // console.log("ETIQIETAS NUEVAS: ", etiquetasNuevas);
    // console.log("ETIQETAS ANTERIORES: ", etiquetasAnteriores);

    // const tarea = new Tarea(
    //   idTarea,
    //   nombre,
    //   descripcion,
    //   fechaProgramada,
    //   null,
    //   fechaUltimaActualizacion,
    //   null,
    //   idUsuario,
    //   prioridad
    // );

    const tareaExistente = await this.tareaDAO.consultarTareaPorId(tarea.idTarea);
    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
    }

    
    await this.tareaDAO.actualizarTarea(tarea);

    const etiquetasParaAgregar = etiquetasNuevas.filter(etiquetaNueva => 
      !etiquetasAnteriores.some(etiquetaAnterior => etiquetaAnterior.nombre === etiquetaNueva.nombre));
    const etiquetasParaEliminar = etiquetasAnteriores.filter(etiquetaAnterior => 
      !etiquetasNuevas.some(etiquetaNueva => etiquetaNueva.nombre === etiquetaAnterior.nombre));

    if (etiquetasParaAgregar.length > 0) {
      await this.servicioEtiqueta.agregarEtiquetas(etiquetasParaAgregar, idTarea, idUsuario);
    }

    if (etiquetasParaEliminar.length > 0) {
      await this.servicioEtiqueta.eliminarEtiquetas(etiquetasParaEliminar);
    }

    const tareaActualizadaConsulta = await this.tareaDAO.consultarTareasPorIdTarea(tarea.idTarea);
    return this.procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
  }

  async actualizarTareaCompletada(idTarea, completada) {
    const tareaExistente = await this.tareaDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con el id: ${idTarea}.`);
    }

    const respuesta = await this.tareaDAO.actualizarTareaCompletada(idTarea, completada);
    if (respuesta <= 0) {
      throw new Error("No se pudo actualizar la tarea");
    }

    return await this.tareaDAO.consultarTareaPorId(idTarea);
  }

  async obtenerTareasPorIdUsuario(idUsuario) {
    // const tareasPendientes = await tareasDAO.consultarTareasPorIdUsuario(idUsuario);
    // const tareasCompletadas = await tareasDAO.consultarTareasCompletadasUsuario(idUsuario);

    // return {
    //   tareasPendientes: this.procesarTareasConEtiquetas(tareasPendientes),
    //   tareasCompletadas: this.procesarTareasConEtiquetas(tareasCompletadas)
    // };
  const tareasPendientes = await this.tareaDAO.consultarTareasPorIdUsuario(idUsuario);
    const tareasCompletadas = await this.tareaDAO.consultarTareasCompletadasUsuario(idUsuario);

    return {tareasPendientes, tareasCompletadas};
  }

  procesarTareasConEtiquetas(tareas) {
    return tareas.map((tarea) => {
      const etiquetas_ids = tarea.etiquetas_ids ? tarea.etiquetas_ids.split(",") : [];
      const etiquetas_nombres = tarea.etiquetas_nombres ? tarea.etiquetas_nombres.split(",") : [];
      const etiquetas_usuarios = tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",") : [];
      const tarea_etiqueta_ids = tarea.tarea_etiqueta_ids ? tarea.tarea_etiqueta_ids.split(",") : [];

      const etiquetas = etiquetas_ids.map((id, index) => ({
        idEtiqueta: id,
        nombre: etiquetas_nombres[index],
        idUsuario: etiquetas_usuarios[index],
        idTareaEtiqueta: tarea_etiqueta_ids[index]
      }));

      const nuevaTarea = new Tarea(
        tarea.tarea_id,
        tarea.tarea_nombre,
        tarea.tarea_descripcion || "",
        tarea.tarea_fecha_programada ? new Date(tarea.tarea_fecha_programada).toLocaleString() : null,
        tarea.tarea_fecha_creacion ? new Date(tarea.tarea_fecha_creacion).toLocaleString() : new Date(),
        tarea.tarea_ultima_actualizacion ? new Date(tarea.tarea_ultima_actualizacion).toLocaleString() : new Date(),
        tarea.tarea_completada || false,
        tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",")[0] : null,
        tarea.tarea_prioridad
      );

      nuevaTarea.etiquetas = etiquetas;
      return nuevaTarea;
    });
  }
}

module.exports = ServicioTarea;