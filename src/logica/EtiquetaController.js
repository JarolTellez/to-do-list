const etiquetaDAO = require("../datos/EtiquetaDAO");
const entidadEtiqueta = require("../dominio/Etiqueta");

async function agregarEtiqueta(etiqueta) {
  try {
    const nuevaEtiqueta = await etiquetaDAO.agregarEtiqueta(etiqueta);
    console.log("Nueva etiqueta guardada: ", nuevaEtiqueta);
  } catch (error) {
    console.log("Error al guardar el usuario: ", error);
  }
}

async function consultarEtiquetas() {
  try {
    const etiquetas = await etiquetaDAO.consultarTodasEtiquetas();
    console.log(etiquetas);
  } catch (error) {
    console.log("Error al consultar etiquetas: ", error);
  }
}

async function consultarEtiquetaNombre() {
  try {
    const etiqueta = await etiquetaDAO.consultarEtiquetaPorNombre(nombre);
    console.log(etiqueta);
  } catch (error) {
    console.log("Error al consultar etiqueta por nombre: ", error);
  }
}

async function consultarEtiquetaId() {
    try {
      const etiqueta = await etiquetaDAO.consultarEtiquetaPorId(id);
      console.log(etiqueta);
    } catch (error) {
      console.log("Error al consultar etiqueta por id: ", error);
    }
  }
consultarEtiquetaNombre();
