const etiquetaDAO = require("../datos/EtiquetaDAO");
const Etiqueta = require("../dominio/Etiqueta");

exports.agregarEtiqueta = async (req, res) => {
  try {
    const { nombreEtiqueta, descripcionEtiqueta, idUsuario } = req.body;

    const etiquetaNeva = new Etiqueta(
      null,
      nombreEtiqueta,
      descripcionEtiqueta,
      idUsuario
    );

    const existe = await etiquetaDAO.consultarEtiquetaPorNombre(nombreEtiqueta);

    if (!existe) {
      return res.status(409).json({
        status: "error",
        message: "La etiqueta ya existe.",
      });
    }

    const etiquetaGuardada = await etiquetaDAO.agregarEtiqueta(etiquetaNeva);

    console.log("Se agrego la etiqueta correctamente: ", etiquetaGuardada);
    return res.status(201).json({
      status: "success",
      message: "Se agrego exitosamente la etiqueta",
      data: {
        idEtiqueta: etiquetaGuardada.idEtiqueta,
        nombre: etiquetaGuardada.nombreEtiqueta,
      },
    });
  } catch (error) {
    console.log("Error al agregar la etiqueta: ", error);
    return res.status(500).json({
      status: "error",
      message: "Error al agregar la etiqueta",
      error: error.message,
    });
  }
};

exports.consultarEtiquetasPorIdUsuario = async (req, res) => {
  const { idUsuario } = req.body;

  try {
    const etiquetas = await etiquetaDAO.consultarEtiquetaPorIdUsuario(
      idUsuario
    );

    if (!etiquetas || etiquetas.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No se encontraron etiquetas para este usuario.",
        data:[]
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
};
