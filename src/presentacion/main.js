import { configurarEventos } from './eventos/etiquetaEventos.js';
import { cargarEtiquetas } from './servicios/etiquetas.js'; // Importar cargarEtiquetas
import {  componentesEtiquetas } from './componentes/etiquetaRender.js'; // Importar componentes para renderizar

document.addEventListener("DOMContentLoaded", function () {
  const inputEtiqueta = document.getElementById("contenedorInput");
  const listaEtiquetas = document.getElementById("listaEtiquetas");
  const contenedorConsultadas = document.getElementById("consultadas");

  // Configurar eventos
  configurarEventos(inputEtiqueta, listaEtiquetas, contenedorConsultadas);

});
