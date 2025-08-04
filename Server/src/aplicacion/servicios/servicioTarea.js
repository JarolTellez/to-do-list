const Tarea = require("../../dominio/entidades/Tarea");
const Etiqueta = require("../../dominio/entidades/Etiqueta");


//const etiquetaServicio = require("../servicios/servicioEtiqueta");

class ServicioTarea {
   constructor(tareaDAO,servicioEtiqueta, servicioTareaEtiqueta) {
    this.tareaDAO =  tareaDAO;
    this.servicioTareaEtiqueta = servicioTareaEtiqueta;
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
// async agregarTarea(tarea) {
//   console.log("TAREA A GAREGAR: ", tarea);
  

//   const tareaAgregada = await this.tareaDAO.agregarTarea(tarea);

//   if (tarea.etiquetas && tarea.etiquetas.length > 0) {
//     for (const etiqueta of tarea.etiquetas) {
//       let idEtiqueta;

//       if (etiqueta.idEtiqueta) {
//         // Ya viene con ID
//         idEtiqueta = etiqueta.idEtiqueta;
//       } else {
//         // Crear objeto Etiqueta y dejar que el servicio maneje si ya existe o no, idEtiqueta y idTareaEtiqueta 
//         const etiquetaNueva = new Etiqueta(
//           etiqueta.idEtiqueta,
//           etiqueta.nombreEtiqueta,
//           etiqueta.descripcion,
//           etiqueta.existente,
//           etiqueta.eliminar,
//           tarea.idUsuario,
//           etiqueta.idTareaEtiqueta
//         );

//         const etiquetaGuardada = await this.servicioEtiqueta.agregarEtiqueta(etiquetaNueva);
//         idEtiqueta = etiquetaGuardada.idEtiqueta;
//       }

//        try {
//       return await this.servicioTareaEtiqueta.guardarTareaEtiqueta(idTarea, idEtiqueta);
//     } catch (error) {
//       console.log("Error al agregar la TareaEtiqueta: ", error);
//       throw error;
//     }
//     }
//   }

//   return tareaAgregada;
// }
async agregarTarea(tarea) {

  try {
    const tareaAgregada = await this.tareaDAO.agregarTarea(tarea);

    if (Array.isArray(tarea.etiquetas)) {
      for (const etiqueta of tarea.etiquetas) {
          console.log("AGREGAR: ", etiqueta.nombreEtiqueta);
        let idEtiqueta;

        if (etiqueta.idEtiqueta) {
          idEtiqueta = etiqueta.idEtiqueta;
        } else {
             const nuevaEtiqueta = new Etiqueta({
            nombreEtiqueta: etiqueta.nombreEtiqueta,
            descripcion: etiqueta.descripcion,
            existente: etiqueta.existente,
            eliminar: etiqueta.eliminar,
            idUsuario: tarea.idUsuario
          });
         

         

          const etiquetaGuardada = await this.servicioEtiqueta.agregarEtiqueta(nuevaEtiqueta);
          idEtiqueta = etiquetaGuardada.idEtiqueta;
        }

        await this.servicioTareaEtiqueta.guardarTareaEtiqueta(tareaAgregada.idTarea, idEtiqueta);
      }
    }

    return tareaAgregada;

  } catch (error) {
    console.error("Error al agregar tarea:", error);
    throw new Error("No se pudo agregar la tarea");
  }
}

// async actualizarTarea(tarea) {
//   console.log("ACTUALIZAR TAREA: ", tarea);

//   const tareaExistente = await this.tareaDAO.consultarTareaPorId(tarea.idTarea);
//   if (!tareaExistente) {
//     throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
//   }

//   // 1. Actualiza la tarea en la base de datos
//   await this.tareaDAO.actualizarTarea(tarea);

//   // 2. Elimina todas las relaciones previas de etiquetas de la tarea
//   await this.servicioTareaEtiqueta.eliminarPorIdTarea(tarea.idTarea);

//   // 3. Agrega etiquetas (crea nuevas si no existen y vincula a la tarea)
//   for (const etiqueta of tarea.etiquetas) {
//     // Verifica si la etiqueta ya existe por nombre e idUsuario
//     let etiquetaExistente = await this.servicioEtiqueta.obtenerPorNombreYUsuario(etiqueta.nombreEtiqueta, tarea.idUsuario);

//     if (!etiquetaExistente) {
//       etiquetaExistente = await this.servicioEtiqueta.agregarEtiqueta(etiqueta);
//     }

//     await this.servicioTareaEtiqueta.guardarTareaEiqueta(tarea.idTarea, etiquetaExistente.idEtiqueta);
//   }

//   // 4. Consulta la tarea actualizada para retornarla
//   const tareaActualizadaConsulta = await this.tareaDAO.consultarTareasPorIdTarea(tarea.idTarea);
//   return this.procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
// }
////////////////////////////LA DOS
// async actualizarTarea(tarea) {
//   console.log("ACTUALIZAR TAREA DESDE SERVICIO TAREA: ", tarea);

//   const tareaExistente = await this.tareaDAO.consultarTareaPorId(tarea.idTarea);
//   if (!tareaExistente) {
//     throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
//   }

//   // Actualizar la información principal de la tarea
//   await this.tareaDAO.actualizarTarea(tarea);

//   // Procesar etiquetas
//   for (const etiqueta of tarea.etiquetas) {
//     console.log("ETIQIETA EN SERVICIO TAREA: ", etiqueta);
//     if (etiqueta.eliminar === true && etiqueta.idTareaEtiqueta) {
//       console.log("ENTRO A ELIMINAR ETIQUET:")
    
//       // Eliminar relación tarea-etiqueta
//       await this.servicioEtiqueta.eliminarEtiquetas([etiqueta]);
//       continue;
//     }

//     if (!etiqueta.existente) {
//       // Etiqueta nueva: agregarla primero
//       const etiquetaNueva = new Etiqueta(
//         null,
//         etiqueta.nombreEtiqueta,
//         etiqueta.descripcion,
//         false,
//         false,
//         etiqueta.idUsuario,
//         null
//       );

//       const etiquetaCreada = await this.servicioEtiqueta.agregarEtiqueta(etiquetaNueva);

//       // Ahora relacionarla con la tarea
//       if (etiquetaCreada && etiquetaCreada.idEtiqueta) {
//         await this.servicioEtiqueta.etiquetaDAO.agregarTareaEtiqueta(tarea.idTarea, etiquetaCreada.idEtiqueta);
//       } else {
//         throw new Error("No se pudo obtener el id de la nueva etiqueta creada.");
//       }
//     } else if (!etiqueta.idTareaEtiqueta) {
//       // Etiqueta existente pero no tiene relación: crear la relación
//       await this.servicioEtiqueta.etiquetaDAO.agregarTareaEtiqueta(tarea.idTarea, etiqueta.idEtiqueta);
//     }
//   }

//   // Obtener la tarea actualizada con etiquetas y retornarla
//   const tareaActualizadaConsulta = await this.tareaDAO.consultarTareasPorIdTarea(tarea.idTarea);
//   console.log("TAREA FINAL ACTUALIZAR: ", tareaActualizadaConsulta);
  
//   return this.procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
// }

async actualizarTarea(tarea) {
  console.log("ACTUALIZAR TAREA DESDE SERVICIO TAREA: ", tarea);

  const tareaExistente = await this.tareaDAO.consultarTareaPorId(tarea.idTarea);
  if (!tareaExistente) {
    throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
  }

  // 1. Actualizar información principal de la tarea
  await this.tareaDAO.actualizarTarea(tarea);

  // 2. Procesar etiquetas
  for (const etiqueta of tarea.etiquetas) {
    console.log("ETIQUETA EN SERVICIO TAREA: ", etiqueta);

    // 2.1 Eliminar relación si es necesario
    if (etiqueta.eliminar === true && etiqueta.idTareaEtiqueta) {
      console.log("ENTRO A ELIMINAR ETIQUETA");
      await this.servicioTareaEtiqueta.eliminarPorIdTareaEtiqueta(etiqueta.idTareaEtiqueta);
      continue;
    }

    // 2.2 Crear nueva etiqueta si no existe
    if (!etiqueta.existente) {
       const nuevaEtiqueta = new Etiqueta({
            nombreEtiqueta: etiqueta.nombreEtiqueta,
            descripcion: etiqueta.descripcion,
            existente: etiqueta.existente,
            eliminar: etiqueta.eliminar,
            idUsuario: tarea.idUsuario
          });
         

      const etiquetaCreada = await this.servicioEtiqueta.agregarEtiqueta(nuevaEtiqueta);

      if (etiquetaCreada && etiquetaCreada.idEtiqueta) {
        await this.servicioTareaEtiqueta.guardarTareaEtiqueta(tarea.idTarea, etiquetaCreada.idEtiqueta);
      } else {
        throw new Error("No se pudo obtener el id de la nueva etiqueta creada.");
      }

    } else if (!etiqueta.idTareaEtiqueta) {
      // 2.3 Si la etiqueta ya existe pero no está relacionada, crear la relación
      await this.servicioTareaEtiqueta.guardarTareaEtiqueta(tarea.idTarea, etiqueta.idEtiqueta);
    }
  }

  // 3. Consultar y retornar tarea actualizada
  const tareaActualizadaConsulta = await this.tareaDAO.consultarTareasPorIdTarea(tarea.idTarea);
  console.log("TAREA FINAL ACTUALIZAR: ", tareaActualizadaConsulta);

  return this.procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
}




  // async agregarTareaEtiqueta(idTarea, idEtiqueta) {
  //   try {
  //     return await this.servicioTareaEtiqueta.guardarTareaEtiqueta(idTarea, idEtiqueta);
  //   } catch (error) {
  //     console.log("Error al agregar la TareaEtiqueta: ", error);
  //     throw error;
  //   }
  // }

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

  // async actualizarTarea(tarea) {
  //   // const {
  //   //   idTarea,
  //   //   nombre,
  //   //   descripcion,
  //   //   fechaProgramada,
  //   //   fechaUltimaActualizacion,
  //   //   idUsuario,
  //   //   prioridad,
  //   //   etiquetasAnteriores,
  //   //   etiquetasNuevas
  //   // } = tareaData;

  //   // console.log("ETIQIETAS NUEVAS: ", etiquetasNuevas);
  //   // console.log("ETIQETAS ANTERIORES: ", etiquetasAnteriores);

  //   // const tarea = new Tarea(
  //   //   idTarea,
  //   //   nombre,
  //   //   descripcion,
  //   //   fechaProgramada,
  //   //   null,
  //   //   fechaUltimaActualizacion,
  //   //   null,
  //   //   idUsuario,
  //   //   prioridad
  //   // );

  //   console.log("ACTUALIZAR TAREA: ",tarea);
  //   const tareaExistente = await this.tareaDAO.consultarTareaPorId(tarea.idTarea);
  //   if (!tareaExistente) {
  //     throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
  //   }

    
  //   await this.tareaDAO.actualizarTarea(tarea);

  //   const etiquetasParaAgregar = etiquetasNuevas.filter(etiquetaNueva => 
  //     !etiquetasAnteriores.some(etiquetaAnterior => etiquetaAnterior.nombre === etiquetaNueva.nombre));
  //   const etiquetasParaEliminar = etiquetasAnteriores.filter(etiquetaAnterior => 
  //     !etiquetasNuevas.some(etiquetaNueva => etiquetaNueva.nombre === etiquetaAnterior.nombre));

  //   if (etiquetasParaAgregar.length > 0) {
  //     await this.servicioEtiqueta.agregarEtiquetas(etiquetasParaAgregar, idTarea, idUsuario);
  //   }

  //   if (etiquetasParaEliminar.length > 0) {
  //     await this.servicioEtiqueta.eliminarEtiquetas(etiquetasParaEliminar);
  //   }

  //   const tareaActualizadaConsulta = await this.tareaDAO.consultarTareasPorIdTarea(tarea.idTarea);
  //   return this.procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
  // }
  


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