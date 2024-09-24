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
    return res.status(201).json(tareaAgregada);
  } catch (error) {
    console.error("Error al agregar la tarea:", error);
    res.status(500).json({ mensaje: "Error al agregar la tarea" });
  }
};
