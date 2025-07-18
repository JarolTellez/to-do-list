const etiquetaService = require("../servicios/servicioEtiqueta");
const {tareaMapper} = require("../config/dependencias");
const { servicioTarea } = require('../config/dependencias');



exports.agregarTarea = async (req, res) => {
  try {
   // const tareaData = req.body;
   console.log("TAAAAAAAAAAAAAREA", req.body);
    const tarea = tareaMapper.requestToDominio(req.body);
    const tareaProcesada = await servicioTarea.agregarTarea(tarea);

    return res.status(201).json({
      status: "success",
      message: `Tarea agregada: ${tareaProcesada}`,
      data: tareaProcesada,
    });
  } catch (error) {
    if (error.message.startsWith('[')) {
      const errores = JSON.parse(error.message);
      return res.status(400).json({
        status: "error",
        message: "Errores de validación",
        error: errores,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar guardar la tarea.",
      error: error.message,
    });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    const { idTarea, idUsuario } = req.body;
    await servicioTarea.eliminarTarea(idTarea, idUsuario);

    return res.status(200).json({
      status: "success",
      message: `Tarea con ID ${idTarea} eliminada correctamente.`,
    });
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
    const tareaData = req.body;
    const tareaProcesada = await servicioTarea.actualizarTarea(tareaData);

    return res.status(201).json({
      status: "success",
      message: `Tarea actualizada: ${tareaProcesada}`,
      data: tareaProcesada,
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
    const tareaActualizada = await servicioTarea.actualizarTareaCompletada(idTarea, completada);

    return res.status(201).json({
      status: "success",
      message: `Tarea actualizada: ${tareaActualizada}`,
      data: tareaActualizada,
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

exports.consultarTareasPorIdUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.body;
    const { tareasPendientes, tareasCompletadas } = await  servicioTarea.obtenerTareasPorIdUsuario(idUsuario);


    return res.status(200).json({
      status: "success",
      message: "Tareas consultadas",
      data: { tareasPendientes, tareasCompletadas }
    });
  } catch (error) {
    console.error("Error al consultar las tareas:", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar consultar las tareas.",
      error: error.message,
    });
  }
};