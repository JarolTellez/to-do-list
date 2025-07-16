import { componentesEtiquetas } from "../../presentacion/componentes/etiquetaRender.js";
import { cargarEtiquetas } from "../../core/servicios/etiquetas.js";

export const etiquetasManejador = {
  async manejarInputChange(query, contenedorConsultadas, inputEtiqueta) {
    if (query) {
      const etiquetasConsultadas = await cargarEtiquetas();
      if (etiquetasConsultadas) {
        await componentesEtiquetas.mostrarEtiquetasConsultadas(
          query,
          contenedorConsultadas,
          inputEtiqueta,
          etiquetasConsultadas
        );
      }
    } else {
      contenedorConsultadas.classList.remove("active");
    }
  },

  manejarKeyDown(e, inputEtiqueta, listaEtiquetas, contenedorConsultadas) {
    if (e.key === " " || e.key === "Enter") {
      const query = inputEtiqueta.value.trim();
      if (query) {
        const etiquetaEnviada = componentesEtiquetas.buscarCoincidencias(query);
        console.log("etiqueta:", etiquetaEnviada);
        if (etiquetaEnviada) {
          componentesEtiquetas.agregarEtiquetaInput(
            etiquetaEnviada,
            listaEtiquetas,
            contenedorConsultadas,
            inputEtiqueta
          );
        }
        inputEtiqueta.value = "";
      }
    }
  }
};