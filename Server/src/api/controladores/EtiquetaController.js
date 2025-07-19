// const etiquetaService = require("../servicios/servicioEtiqueta");

// exports.consultarEtiquetasPorIdUsuario = async (req, res) => {
//   const { idUsuario } = req.body;

//   try {
//     const etiquetas = await etiquetaService.consultarEtiquetasPorIdUsuario(idUsuario);

//     if (!etiquetas || etiquetas.length === 0) {
//       return res.status(200).json({
//         status: "success",
//         message: "No se encontraron etiquetas para este usuario.",
//         data: [],
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       data: etiquetas,
//     });
//   } catch (error) {
//     console.log("Error al consultar las etiquetas: ", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error al consultar las etiquetas.",
//       error: error.message,
//     });
//   }
// };

class EtiquetaController {
  constructor({ servicioEtiqueta, etiquetaMapper }) {
    this.servicioEtiqueta = servicioEtiqueta;
    this.etiquetaMapper = etiquetaMapper;
  }

  async consultarEtiquetasPorIdUsuario(req, res) {
    const { idUsuario } = req.body;

    try {
      const etiquetas = await this.servicioEtiqueta.consultarEtiquetasPorIdUsuario(idUsuario);

      if (!etiquetas || etiquetas.length === 0) {
        return res.status(200).json({
          status: "success",
          message: "No se encontraron etiquetas para este usuario.",
          data: [],
        });
      }

      return res.status(200).json({
        status: "success",
        data: etiquetas,
      });
    } catch (error) {
      console.log("Error al consultar las etiquetas: ", error);
      return res.status(500).json({
        status: "error",
        message: "Error al consultar las etiquetas.",
        error: error.message,
      });
    }
  }
}

module.exports = EtiquetaController;