import {
  pendingTasks,
  completedTasks,
  updateTasksList,
} from "./taskHandler.js";
import { taskRender } from "../../presentacion/componentes/taskRender.js";
import { messageRender } from "../../presentacion/componentes/messageRender.js";
import { FilterSort } from "../../filterSort.js";
import { PendingTaskSpecification } from "../../filters/pendingTaskSpecification.js";
import { CompletedTaskSpecification } from "../../filters/completedTaskSpecification.js";
import { DueTodaySpecification } from "../../filters/dueTodaySpecification.js";
import { SortByDateAsc } from "../../sorters/sortByDateAsc.js";
import { SortByDateDesc } from "../../sorters/sortByDateDesc.js";
import { SortByPriorityAsc} from "../../sorters/sortByPriorityAsc.js";
import { SortByPriorityDesc } from "../../sorters/sortByPriorityDesc.js";

// Variables globales
let pendingTasksBtn, completedTasksBtn;
let highestPriorityBtn, lowestPriorityButton;
let tasksContainer;
let filtersContainer;
let todayTasksFilterBtn;
let upcomingTasksBtn;
let priorityFilterRadio = null;
let scheduledFilterRadio = null;
let currentRenderedTasks;
let currentPriorityFilteresTasks;

const sorter = new FilterSort();
//sorter.setFilter(new PendingTaskSpecification());

export function pendingBtnChecked(selected) {
  pendingTasksBtn.checked =
    selected && selected == true ? true : false;
  pendingTasksBtn.checked = true;
  pendingTasksBtn.closest(".radio").classList.add("selected");
  completedTasksBtn.checked = false;
  completedTasksBtn.closest(".radio").classList.remove("selected");

  const filtroEspecial = new DueTodaySpecification();
  const tareasHoy = pendingTasks.filter((tarea) =>
    filtroEspecial.satisfies(tarea)
  );
  if (pendingTasksBtn.checked && tareasHoy.length <= 0) {
    if (scheduledFilterRadio) {
      todayTasksFilterBtn.checked = false;
      todayTasksFilterBtn.closest(".radio").classList.remove("selected");
      scheduledFilterRadio = null;
    }
  }

  updateLists();
}

export async function updateLists() {
 
  let mensaje = null;
  let mensajeFlotante = "No hay tareas para aplicar filtros";

  let baseFilter;
  if (completedTasksBtn.checked) {
    baseFilter = new CompletedTaskSpecification();
    if (completedTasks.length <= 0) {
      mensaje = "No hay tareas completadas";
      disableFilters();
      disablePriorityFilters();
    }
  } else if (pendingTasksBtn.checked) {
    baseFilter = new PendingTaskSpecification();
    if (pendingTasks.length <= 0) {
      mensaje = "No hay tareas pendientes";
      disableFilters();
      disablePriorityFilters();
      messageRender.showToast(mensajeFlotante, true);
    }
  }

  sorter.cleanSorters();

  if (highestPriorityBtn.checked && priorityFilterRadio) {
    sorter.addSorter(new SortByPriorityDesc());
  } else if (lowestPriorityButton.checked && priorityFilterRadio) {
    sorter.addSorter(new SortByPriorityAsc());
  }

  if (upcomingTasksBtn.checked) {
    sorter.addSorter(new SortByDateDesc());
  }

  let additionalFilter = null;
  if (todayTasksFilterBtn.checked) {
    additionalFilter = new DueTodaySpecification();
  }

  if (baseFilter && additionalFilter) {
    const combination = await baseFilter.and(additionalFilter);
    sorter.setFilter(combination);
  } else {
    sorter.setFilter(baseFilter);
  }

  const tasksToProcess = completedTasksBtn.checked
    ? completedTasks
    : pendingTasks;
/////////////////////////////////////////////////////////////////////////////////
  currentRenderedTasks = sorter.sort(tasksToProcess);

  if (currentRenderedTasks.length === 0 && additionalFilter) {
    mensaje = todayTasksFilterBtn.checked
      ? "No hay tareas para hoy"
      : "No hay tareas próximas";
  }

  console.log("TAREAS DESDE ACTUALIZAR LISTAS: ", currentRenderedTasks);
  taskRender.renderTasks(
    tasksContainer,
    currentRenderedTasks,
    true,
    mensaje
  );
}

function disableFilters() {
  highestPriorityBtn.checked = false;
  lowestPriorityButton.checked = false;
  todayTasksFilterBtn.checked = false;
  upcomingTasksBtn.checked = false;

  highestPriorityBtn.closest(".radio").classList.remove("selected");
  lowestPriorityButton.closest(".radio").classList.remove("selected");
  todayTasksFilterBtn.closest(".radio").classList.remove("selected");
  upcomingTasksBtn.closest(".radio").classList.remove("selected");
}

function disablePriorityFilters() {
  highestPriorityBtn.checked = false;
  lowestPriorityButton.checked = false;

  highestPriorityBtn.closest(".radio").classList.remove("selected");
  lowestPriorityButton.closest(".radio").classList.remove("selected");
}

function setupPriorityToggle() {
  document
    .querySelectorAll('.contenedorFiltroPrioridad input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        if (this === priorityFilterRadio) {
          this.closest(".radio").classList.remove("selected");
          this.checked = false;
          priorityFilterRadio = null;
          updateLists();
        } else if (currentRenderedTasks.length > 0) {
          priorityFilterRadio = this;
        }
      });
    });

  if (currentPriorityFilteresTasks) {
    currentPriorityFilteresTasks.length = 0;
  }
}

function deseleccionarTareasParaHoy() {
  document
    .querySelectorAll('.contenedorFiltroProgramadas input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        if (this === scheduledFilterRadio) {
          this.closest(".radio").classList.remove("selected");
          this.checked = false;
          todayTasksFilterBtn.checked = false;
          scheduledFilterRadio = null;
          updateLists();
        } else {
          scheduledFilterRadio = this;
        }
      });
    });
}

function cargarModoBase() {
  pendingTasksBtn.checked = true;
  pendingTasksBtn.closest(".radio").classList.add("selected");
  currentRenderedTasks = [...pendingTasks];
}

export function initializeHandlers() {
  tasksContainer = document.querySelector("#listaTareas");
  filtersContainer = document.querySelector(".filtros");
  pendingTasksBtn = document.querySelector("#tareasPendientesFiltro");
  completedTasksBtn = document.querySelector("#tareasCompletadasFiltro");
  highestPriorityBtn = document.querySelector("#prioridadMayorFiltro");
  lowestPriorityButton = document.querySelector("#prioridadMenorFiltro");
  todayTasksFilterBtn = document.querySelector("#tareasParaHoyFiltro");
  upcomingTasksBtn = document.querySelector("#tareasProximasFiltro");

  setupPriorityToggle();
  deseleccionarTareasParaHoy();
  cargarModoBase();
}

export function getRenderTasks() {
  return [...currentRenderedTasks]; // s devuelvo copia
}
