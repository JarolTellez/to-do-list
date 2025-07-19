// const etiquetaService = require("../servicios/servicioEtiqueta");
// const {tareaMapper} = require("../config/dependencias");
// const { servicioTarea } = require('../config/dependencias');



// exports.agregarTarea = async (req, res) => {
//   try {
//    // const tareaData = req.body;
//    console.log("TAAAAAAAAAAAAAREA", req.body);
//     const tarea = tareaMapper.requestToDominio(req.body);
//     const tareaProcesada = await servicioTarea.agregarTarea(tarea);

//     return res.status(201).json({
//       status: "success",
//       message: `Tarea agregada: ${tareaProcesada}`,
//       data: tareaProcesada,
//     });
//   } catch (error) {
//     if (error.message.startsWith('[')) {
//       const errores = JSON.parse(error.message);
//       return res.status(400).json({
//         status: "error",
//         message: "Errores de validación",
//         error: errores,
//       });
//     }

//     return res.status(500).json({
//       status: "error",
//       message: "Ocurrió un error al intentar guardar la tarea.",
//       error: error.message,
//     });
//   }
// };

// exports.eliminarTarea = async (req, res) => {
//   try {
//     const { idTarea, idUsuario } = req.body;
//     await servicioTarea.eliminarTarea(idTarea, idUsuario);

//     return res.status(200).json({
//       status: "success",
//       message: `Tarea con ID ${idTarea} eliminada correctamente.`,
//     });
//   } catch (error) {
//     console.error("Error al eliminar la tarea:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Ocurrió un error al intentar eliminar la tarea.",
//       error: error.message,
//     });
//   }
// };

// exports.actualizarTarea = async (req, res) => {
//   try {
//     const tareaData = req.body;
//     const tareaProcesada = await servicioTarea.actualizarTarea(tareaData);

//     return res.status(201).json({
//       status: "success",
//       message: `Tarea actualizada: ${tareaProcesada}`,
//       data: tareaProcesada,
//     });
//   } catch (error) {
//     console.error("Error al actualizar la tarea:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Ocurrió un error al intentar actualizar la tarea.",
//       error: error.message,
//     });
//   }
// };

// exports.actualizarTareaCompletada = async (req, res) => {
//   try {
//     const { idTarea, completada } = req.body;
//     const tareaActualizada = await servicioTarea.actualizarTareaCompletada(idTarea, completada);

//     return res.status(201).json({
//       status: "success",
//       message: `Tarea actualizada: ${tareaActualizada}`,
//       data: tareaActualizada,
//     });
//   } catch (error) {
//     console.error("Error al actualizar la tarea:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Ocurrió un error al intentar actualizar la tarea.",
//       error: error.message,
//     });
//   }
// };

// exports.consultarTareasPorIdUsuario = async (req, res) => {
//   try {
//     const { idUsuario } = req.body;
//     const { tareasPendientes, tareasCompletadas } = await  servicioTarea.obtenerTareasPorIdUsuario(idUsuario);


//     return res.status(200).json({
//       status: "success",
//       message: "Tareas consultadas",
//       data: { tareasPendientes, tareasCompletadas }
//     });
//   } catch (error) {
//     console.error("Error al consultar las tareas:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Ocurrió un error al intentar consultar las tareas.",
//       error: error.message,
//     });
//   }
// };

// api/controllers/tareaController.js
class TareaController {
  constructor({ servicioTarea, tareaMapper }) {
    this.servicioTarea = servicioTarea;
    this.tareaMapper = tareaMapper;
   
  }

  async agregarTarea(req, res) {
    try {
    //  console.log("Datos de tarea recibidos:", req.body);
      const tarea = this.tareaMapper.requestToDominio(req.body);
      const tareaProcesada = await this.servicioTarea.agregarTarea(tarea);

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

      console.error("Error en agregarTarea:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocurrió un error al intentar guardar la tarea.",
        error: error.message,
      });
    }
  }

  async eliminarTarea(req, res) {
    try {
      const { idTarea, idUsuario } = req.body;
      await this.servicioTarea.eliminarTarea(idTarea, idUsuario);

      return res.status(200).json({
        status: "success",
        message: `Tarea con ID ${idTarea} eliminada correctamente.`,
      });
    } catch (error) {
      console.error("Error en eliminarTarea:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocurrió un error al intentar eliminar la tarea.",
        error: error.message,
      });
    }
  }

  async actualizarTarea(req, res) {
    try {
     // const tarea = req.body;
        const tarea = this.tareaMapper.requestToDominio(req.body);
      //const tarea = this.tareaMapper.requestToDominio(req.body);
      const tareaProcesada = await this.servicioTarea.actualizarTarea(tarea);

      return res.status(200).json({
        status: "success",
        message: `Tarea actualizada: ${tareaProcesada}`,
        data: tareaProcesada,
      });
    } catch (error) {
      console.error("Error en actualizarTarea:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocurrió un error al intentar actualizar la tarea.",
        error: error.message,
      });
    }
  }

  async actualizarTareaCompletada(req, res) {
    try {
      const { idTarea, completada } = req.body;
      const tareaActualizada = await this.servicioTarea.actualizarTareaCompletada(idTarea, completada);

      return res.status(200).json({
        status: "success",
        message: `Estado de tarea actualizado: ${tareaActualizada}`,
        data: tareaActualizada,
      });
    } catch (error) {
      console.error("Error en actualizarTareaCompletada:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocurrió un error al intentar actualizar el estado de la tarea.",
        error: error.message,
      });
    }
  }

  async consultarTareasPorIdUsuario(req, res) {
    try {
      const { idUsuario } = req.body;
      const { tareasPendientes, tareasCompletadas } = await this.servicioTarea.obtenerTareasPorIdUsuario(idUsuario);

      return res.status(200).json({
        status: "success",
        message: "Tareas consultadas exitosamente",
        data: { tareasPendientes, tareasCompletadas }
      });
    } catch (error) {
      console.error("Error en consultarTareasPorIdUsuario:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocurrió un error al intentar consultar las tareas.",
        error: error.message,
      });
    }
  }
}

module.exports = TareaController;
