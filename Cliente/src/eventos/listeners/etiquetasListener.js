
import { etiquetasManejador } from "../manejadores/etiquetasManejador.js";

document.addEventListener("DOMContentLoaded", function () {
  const inputEtiqueta = document.getElementById("contenedorInput");
  const listaEtiquetas = document.getElementById("listaEtiquetas");
  const contenedorConsultadas = document.getElementById("consultadas");
  
  configurarEventos();

  function configurarEventos() {
    // Evento para que se busque etiquetas cuando se esta escribiendo
    inputEtiqueta.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      await etiquetasManejador.manejarInputChange(query, contenedorConsultadas, inputEtiqueta);
    });

    // Evento para agregar eiquetas al campo cuando se haga espacio o enter
    inputEtiqueta.addEventListener("keydown", (e) => {
      etiquetasManejador.manejarKeyDown(e, inputEtiqueta, listaEtiquetas, contenedorConsultadas);
    });
  }
});