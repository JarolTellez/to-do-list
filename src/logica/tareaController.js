const tareasDAO = require("../datos/TareaDAO");
const Tarea = require("../dominio/Tarea");
const etiquetaController = require("./EtiquetaController");

exports.agregarTarea = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
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
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad
    );
    const tareaAgregada = await tareasDAO.agregarTarea(tarea);
    if (etiquetas.length > 0) {
      etiquetaController.agregarEtiquetas(
        etiquetas,
        tareaAgregada.idTarea,
        idUsuario
      );
    }
    console.log("Tarea agregada:", tareaAgregada);
    return res.status(201).json({
      status: "success",
      message: `Tarea agregada: ${tareaAgregada}`,
      data: {
        idTarea: tareaAgregada.idTarea,
        nombre: tareaAgregada.nombre,
      },
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
  try {
    const { idTarea } = req.body;

    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);

    if (!tareaExistente) {
      return res.status(404).json({
        status: "error",
        message: `No se encontro la tarea con id ${idTarea}`,
      });
    }

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
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad,
    } = req.body;

    const tarea = new Tarea(
      idTarea,
      nombre,
      descripcion,
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad
    );
    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      return res.status(404).json({
        status: "error",
        message: `No se encontró la tarea con el id: ${id}.`,
      });
    }

    const TareaActualizada = await tareasDAO.actualizarTarea(tarea);
    console.log("Tarea actualizada correctamente: ", TareaActualizada);
    return res.status(201).json({
      status: "success",
      message: `Tarea actualizada: ${TareaActualizada}`,
      data: tarea,
      TareaActualizada,
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
    const {
      idTarea,
      completada,
    } = req.body;

    
    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      return res.status(404).json({
        status: "error",
        message: `No se encontró la tarea con el id: ${id}.`,
      });
    }

    const respuesta = await tareasDAO.actualizarTareaCompletada(idTarea,completada);
    if(respuesta>0){
    const tareaActualizada=await tareasDAO.consultarTareaPorId(idTarea);
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

exports.consultarTareasPorIdUsuario= async (req, res) => {
  try {
    const { idUsuario } = req.body;

    const tareas = await tareasDAO.consultarTareasPorIdUsuario(idUsuario);
    const tareasProcesadas= procesarTareasConEtiquetas(tareas);
    console.log("TAREAS SIN PROCESAS:", tareas);
    console.log("TAREAS PROCESAS: ",tareasProcesadas);

    return res.status(200).json({
      status: "success",
      message: "Tareas consultadas",
      data: tareasProcesadas,
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
  return tareas.map(tarea => {
    const etiquetas_ids = tarea.etiquetas_ids ? tarea.etiquetas_ids.split(',') : [];
    const etiquetas_nombres = tarea.etiquetas_nombres ? tarea.etiquetas_nombres.split(',') : [];
    const etiquetas_usuarios = tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(',') : [];

    // Se crea el arreglo de objetos de etiquetas
    const etiquetas = etiquetas_ids.map((id, index) => ({
      idEtiqueta: id,
      nombre: etiquetas_nombres[index],
      idUsuario: etiquetas_usuarios[index]
    }));
    etiquetas.reverse();
    return {
      ...tarea,
      etiquetas
    };
  });
};


