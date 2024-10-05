import {
  componentesEtiquetas,
  etiquetasSeleccionadas,
} from "../componentes/etiquetaRender.js";

import { cargarEtiquetas } from "../servicios/etiquetas.js";

document.addEventListener("DOMContentLoaded", function () {
  const inputEtiqueta = document.getElementById("contenedorInput");
  const listaEtiquetas = document.getElementById("listaEtiquetas");
  const contenedorConsultadas = document.getElementById("consultadas");
  configurarEventos();

 function configurarEventos() {
  inputEtiqueta.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (query) {
    const etiquetasConsultadas=await cargarEtiquetas();
    if(etiquetasConsultadas){
      await componentesEtiquetas.mostrarEtiquetasConsultadas(
        query,
        contenedorConsultadas,inputEtiqueta,etiquetasConsultadas
      );
    }
    } else {
      contenedorConsultadas.classList.remove("active");
    }
  });

  inputEtiqueta.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      const query = inputEtiqueta.value.trim();
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
  });
}
});
