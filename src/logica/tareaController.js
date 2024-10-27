const tareasDAO = require("../datos/TareaDAO");
const Tarea = require("../dominio/Tarea");
const etiquetaController = require("./EtiquetaController");

exports.agregarTarea = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      fechaProgramada,
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad,
      etiquetas,
    } = req.body;

    const tarea = new Tarea(
      null,
      nombre,
      descripcion,
      fechaProgramada,
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad
    );

    console.log("TAREA A AGREGAR",tarea);
    const tareaAgregada = await tareasDAO.agregarTarea(tarea);
    if (etiquetas.length > 0) {
      await etiquetaController.agregarEtiquetas(
        etiquetas,
        tareaAgregada.idTarea,
        idUsuario
      );
    }

    const tareaConEtiquetas = await tareasDAO.consultarTareasPorIdTarea(
      tareaAgregada.idTarea
    );

    const tareaProcesada = procesarTareasConEtiquetas(tareaConEtiquetas);
    

    return res.status(201).json({
      status: "success",
      message: `Tarea agregada: ${tareaProcesada}`,
      data: tareaProcesada,
    });
  } catch (error) {
    console.error("Error al agregar la tarea:", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar guardar la tarea.",
      error: error.message,
    });
  }
};

exports.eliminarTarea = async (req, res) => {
  console.log("LLEGOO A ELIMINAR CONTOL")
  try {
    const { idTarea, idUsuario } = req.body;

    const tareaExistente = await tareasDAO.consultarTareaPorIdTareaUsuario(
      idTarea,
      idUsuario
    );

    if (!tareaExistente) {
      return res.status(404).json({
        status: "error",
        message: `No se encontro la tarea con id ${idTarea}`,
      });
    }

    const etiquetasEliminadas =
      await etiquetaController.eliminarEtiquetasPorIdTarea(idTarea);

      const eliminada = await tareasDAO.eliminarTarea(idTarea);
      if (eliminada > 0) {
        console.log("Tarea eliminada");
        return res.status(200).json({
          status: "success",
          message: `Tarea con ID ${idTarea} eliminada correctamente.`,
        });
      }
    
  } catch (error) {
    console.error("Error al eliminar la tarea:", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar eliminar la tarea.",
      error: error.message,
    });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const {
      idTarea,
      nombre,
      descripcion,
      fechaProgramada,
      fechaUltimaActualizacion,
      idUsuario,
      prioridad,
      etiquetasAnteriores,
      etiquetasNuevas
    } = req.body;


    const tarea = new Tarea(
      idTarea,
      nombre,
      descripcion,
      fechaProgramada,
      null,
      fechaUltimaActualizacion,
      null,
      idUsuario,
      prioridad
    );
    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      return res.status(404).json({
        status: "error",
        message: `No se encontró la tarea con el id: ${idTarea}.`,
      });
    }

    const TareaActualizada = await tareasDAO.actualizarTarea(tarea);
   

    

const etiquetasParaAgregar= etiquetasNuevas.filter(etiquetaNueva=>!etiquetasAnteriores.some(etiquetaAnterior=> etiquetaAnterior.nombre===etiquetaNueva.nombre));
const etiquetasParaEliminar= etiquetasAnteriores.filter(etiquetaAnterior=>!etiquetasNuevas.some(etiquetaNueva=>etiquetaNueva.nombre===etiquetaAnterior.nombre));

 // PARA AGREGAR LAS NUEVAS ETIQUETAS
 if(etiquetasParaAgregar){
  await etiquetaController.agregarEtiquetas(
    etiquetasParaAgregar,
    idTarea,
    idUsuario
  );
}

  console.log("etiquetas a agregar",etiquetasParaAgregar);
console.log("etiquetas a eliminar",etiquetasParaEliminar);
  if(etiquetasParaEliminar){
    await etiquetaController.eliminarEtiquetas(etiquetasParaEliminar);
  }
  const tareaActualizadaConsulta=await tareasDAO.consultarTareasPorIdTarea(tarea.idTarea);
  //Le paso la primer posicion para enviar solo el objeto y no el array, ya que el metodo
  //para procesar regresa un array porque puede procesar muchas tareas en este caso solo le mando
  //una por eso solo regreso la primer posicion para evitar que se mande como array.
  const tareaProcesada=procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
 

    return res.status(201).json({
      status: "success",
      message: `Tarea actualizada: ${tareaProcesada}`,
      data:tareaProcesada,
    });
  } catch (error) {
    console.error("Error al actualizar la tarea:", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar actualizar la tarea.",
      error: error.message,
    });
  }
};

 

exports.actualizarTareaCompletada = async (req, res) => {
  try {
    const { idTarea, completada } = req.body;

    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      return res.status(404).json({
        status: "error",
        message: `No se encontró la tarea con el id: ${id}.`,
      });
    }

    const respuesta = await tareasDAO.actualizarTareaCompletada(
      idTarea,
      completada
    );
    if (respuesta > 0) {
      const tareaActualizada = await tareasDAO.consultarTareaPorId(idTarea);
      console.log("Tarea actualizada correctamente: ", tareaActualizada);
      return res.status(201).json({
        status: "success",
        message: `Tarea actualizada: ${tareaActualizada}`,
        data: tareaActualizada,
      });
    }
  } catch (error) {
    console.error("Error al actualizar la tarea:", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar actualizar la tarea.",
      error: error.message,
    });
  }
};

exports.consultarTareasPorIdUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.body;

    //Accedo a las tareas pendientes
    const tareasPendientes = await tareasDAO.consultarTareasPorIdUsuario(idUsuario);
    const tareasPendientesProcesadas = procesarTareasConEtiquetas(tareasPendientes);
    //Accedo a todas las tareas
   const tareasCompletadas=await tareasDAO.consultarTareasCompletadasUsuario(idUsuario);
   const tareasCompletadasProcesadas=procesarTareasConEtiquetas(tareasCompletadas);

    return res.status(200).json({
      status: "success",
      message: "Tareas consultadas",
      data: {
        tareasPendientes: tareasPendientesProcesadas,
        tareasCompletadas: tareasCompletadasProcesadas
    }
    });
  } catch (error) {
    console.error("Error al consultar las tareas :", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar consultar las tareas.",
      error: error.message,
    });
  }
};

// para agregar las etiquetas como objeto (antes de procesar estan en una linea de texto)

const procesarTareasConEtiquetas = (tareas) => {
 // console.log("Tareas",tareas);
  return tareas.map((tarea) => {
    const etiquetas_ids = tarea.etiquetas_ids ? tarea.etiquetas_ids.split(",") : [];
    const etiquetas_nombres = tarea.etiquetas_nombres ? tarea.etiquetas_nombres.split(",") : [];
    const etiquetas_usuarios = tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",") : [];
    
    // Obtener las ids de tareaEtiqueta
    const tarea_etiqueta_ids = tarea.tarea_etiqueta_ids ? tarea.tarea_etiqueta_ids.split(",") : [];

    const etiquetas = etiquetas_ids.map((id, index) => ({
      idEtiqueta: id,
      nombre: etiquetas_nombres[index],
      idUsuario: etiquetas_usuarios[index],
      idTareaEtiqueta: tarea_etiqueta_ids[index] // Agregando idTareaEtiqueta
    }));
    

    const nuevaTarea = new Tarea(
      tarea.tarea_id,
      tarea.tarea_nombre,
      tarea.tarea_descripcion || "",
      tarea.tarea_fecha_programada,
      tarea.tarea_fecha_creacion
        ?tarea.tarea_fecha_creacion
        : new Date(),
      tarea.tarea_ultima_actualizacion
        ?tarea.tarea_ultima_actualizacion
        : new Date(),
      tarea.tarea_completada || false,
      tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",")[0] : null, // Asignar el idUsuario si está disponible
      tarea.tarea_prioridad
    );


    nuevaTarea.etiquetas = etiquetas;

    return nuevaTarea;
  });
};
