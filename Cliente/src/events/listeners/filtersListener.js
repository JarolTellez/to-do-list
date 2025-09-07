import { updateTasksList } from "../handlers/taskHandler.js";
import {
  updateLists,
  getRenderTasks,
  initializeHandlers,
} from "../handlers/filtersHandler.js";

document.addEventListener("DOMContentLoaded", async function () {
  await initializeHandlers();
  await updateTasksList();

  // Event listeners
  document
    .querySelector("#tareasCompletadasFiltro")
    .addEventListener("click", function () {
      updateLists();
    });

  document
    .querySelector("#tareasPendientesFiltro")
    .addEventListener("click", function () {
      updateLists();
    });

  document
    .querySelector("#prioridadMayorFiltro")
    .addEventListener("click", function () {
      updateLists();
    });

  document
    .querySelector("#prioridadMenorFiltro")
    .addEventListener("click", function () {
      updateLists();
    });

  document
    .querySelector("#tareasParaHoyFiltro")
    .addEventListener("click", function () {
      updateLists();
    });

  document
    .querySelector("#tareasProximasFiltro")
    .addEventListener("click", function () {
      updateLists();
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
            getRenderTasks().length > 0 ||
            this.value == "Pendientes" ||
            this.value == "hoy"
          ) {
            this.closest(".radio").classList.add("selected");
          }
        }
      });
    });
});
