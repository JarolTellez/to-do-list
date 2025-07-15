import { actualizarListaTareas } from "./tareasListener.js";
import {
  actualizarListas,
  getTareasRenderizadas,
  inicializarManejadores,
} from "../manejadores/filtrosManejador.js";

document.addEventListener("DOMContentLoaded", async function () {
  await inicializarManejadores();
  await actualizarListaTareas();

  // Event listeners
  document
    .querySelector("#tareasCompletadasFiltro")
    .addEventListener("click", function () {
      actualizarListas();
    });

  document
    .querySelector("#tareasPendientesFiltro")
    .addEventListener("click", function () {
      actualizarListas();
    });

  document
    .querySelector("#prioridadMayorFiltro")
    .addEventListener("click", function () {
      actualizarListas();
    });

  document
    .querySelector("#prioridadMenorFiltro")
    .addEventListener("click", function () {
      actualizarListas();
    });

  document
    .querySelector("#tareasParaHoyFiltro")
    .addEventListener("click", function () {
      actualizarListas();
    });

  document
    .querySelector("#tareasProximasFiltro")
    .addEventListener("click", function () {
      actualizarListas();
    });

  // Radio button styling
  document
    .querySelectorAll('input[type="radio"].opcionFiltro')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        const groupName = this.name;
        document
          .querySelectorAll(`input[name="${groupName}"]`)
          .forEach((radioInGroup) => {
            radioInGroup.closest(".radio").classList.remove("selected");
          });

        if (this.checked) {
          if (
            getTareasRenderizadas().length > 0 ||
            this.value == "Pendientes" ||
            this.value == "hoy"
          ) {
            this.closest(".radio").classList.add("selected");
          }
        }
      });
    });
});
