const tareasDAO = require("../datos/TareaDAO");
const Tarea = require("../dominio/Tarea");

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
  
    console.log("Tarea agregada:", tareaAgregada);
    return res.status(201).json({
      status: 'success',
      message: `Tarea agregada: ${tarea}`
    });
  } catch (error) {
    console.error("Error al agregar la tarea:", error);
    return res.status(500).json({
      status: 'error',
      message: 'Ocurrió un error al intentar guardar la tarea.',
      error: error.message 
    });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    const {idTarea}=req.body;

    const eliminada=await tareasDAO.eliminarTarea(idTarea);

    if(eliminada>0){
      console.log("Tarea eliminada")
     return res.status(200).json({
        status: 'success',
        message: `Tarea con ID ${idTarea} eliminada correctamente.`
      });
    }
  } catch (error) {
    console.error("Error al eliminar la tarea:", error); 
    return res.status(500).json({
      status: 'error',
      message: 'Ocurrió un error al intentar eliminar la tarea.',
      error: error.message 
    });
    
  }
};
