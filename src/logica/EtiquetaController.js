const etiquetaDAO = require("../datos/EtiquetaDAO");
const tareaEtiquetaDAO = require("../datos/TareaEtiquetaDAO");
const Etiqueta = require("../dominio/Etiqueta");
const TareaEtiqueta = require("../dominio/TareaEtiqueta");

exports.agregarEtiqueta = async (etiquetas, idTarea, idUsuario) => {
  for (const etiqueta of etiquetas) {
    if (!etiqueta.hasOwnProperty("idEtiqueta")) {
      const etiquetaNueva = new Etiqueta(null, etiqueta.nombre, idUsuario);
      const nuevaEtiqueta = await agregarEtiqueta(etiquetaNueva);
      
console.log("NUEVA ETIQUETAA: ",nuevaEtiqueta);
      const tareaEtiqueta = new TareaEtiqueta(
        null,
        idTarea,
        nuevaEtiqueta.idEtiqueta
      );

      await agregarTareaEtiqueta(tareaEtiqueta);
    } else {
      const tareaEtiqueta = new TareaEtiqueta(
        null,
        idTarea,
        etiqueta.idEtiqueta
      );
     await agregarTareaEtiqueta(tareaEtiqueta);
    }
  }
};

async function agregarEtiqueta(etiqueta) {
  try {
    const existe = await etiquetaDAO.consultarEtiquetaPorNombre(
      etiqueta.nombreEtiqueta
    );
    if (existe) {
      return null;
    }

    const etiquetaGuardada = await etiquetaDAO.agregarEtiqueta(etiqueta);
    console.log("Se agrego la etiqueta correctamente: ", etiquetaGuardada);
    return etiquetaGuardada;
  } catch (error) {
    console.log("Error al agregar la etiqueta: ", error);
  }
}

async function agregarTareaEtiqueta(tareaEtiqueta) {
  try {
    const TareaEtiquetaGuardada = await tareaEtiquetaDAO.agregarTareaEtiqueta(
      tareaEtiqueta
    );
    
    console.log("Se agrego la Tareaetiqueta correctamente: ", TareaEtiquetaGuardada);
    return TareaEtiquetaGuardada;
  } catch (error) {
    console.log("Error al agregar la TareaEtiqueta: ", error);
  }
}

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
};
