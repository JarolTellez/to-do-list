import {
  pendingTasks,
  completedTasks,
  updateTasksList,
  getStats,
   handleCreateTask,
  handleDeleteTask,
  handleUpdateTask,
  handleCompleteTask,
  convertToMySQLDateTime
} from "../handlers/taskHandler.js";
import { taskRender } from "../../presentacion/componentes/taskRender.js";
import { messageRender } from "../../presentacion/componentes/messageRender.js";
import { selectedTags, tagComponent } from "../../presentacion/componentes/tagRender.js";
import { pendingBtnChecked, updateLists } from "../handlers/filtersHandler.js";
import { Tag } from "../../models/tagModel.js";
import {mapInputToTask} from "../../mappers/taskMapper.js";

document.addEventListener("DOMContentLoaded", async function () {
  const nameTask = document.querySelector(".nameTask");
  const tituloMensaje = document.querySelector('#tituloMensaje');
  const taskDescription = document.querySelector(".taskDescription");
  const messageDescription = document.querySelector('#messageDescription');
  const taskScheduledDate = document.querySelector("#fechaInputModal");
  const addMainTaskButton = document.querySelector("#agregarTareaPrincipal");
  const tagsLists = document.querySelector("#tagsList");
  const taskContainer = document.querySelector("#listaTareas");
  const taskForm = document.querySelector("form");
  const clearDeleteModalBtn = document.querySelector(".limpiarRestaurarModal");
  const addModalBtn = document.querySelector(".agregarModal");
  const cancelModalBtn = document.querySelector(".cancelarModal");
  const modal = document.querySelector("#miModal");
  const totalTasksCount = document.querySelector("#total-tareas");
  const completedCount = document.querySelector("#completadas");
  const pendingCount = document.querySelector("#pendientes");
  const filersContainer = document.querySelector(".filtros");

  let tagsToUpdate;
  let selectedRadio = null;

  // Inicializar todo
  await initializeApp();

  // Event Listeners
  addMainTaskButton.addEventListener("click", showCreateTaskModal);
  nameTask.addEventListener('input', updateNameCounter);
  taskDescription.addEventListener('input', updateDescriptionCounter);
  taskContainer.addEventListener("click", handlerTaskContainerEvents);
  taskForm.addEventListener("submit", handleFormSubmit);
  clearDeleteModalBtn.addEventListener("click", clearDeleteModal);
  cancelModalBtn.addEventListener("click",cancel);

 
  async function initializeApp() {
    await updateStatsAndRender();
    setupPriorityToggle();
  }

  async function updateStatsAndRender() {
    const stats = await getStats();
    updateStatsDOM(stats);
    console.log("TAREAS PENDIENTES", pendingTasks);
    taskRender.renderTasks(
      taskContainer, 
      pendingTasks,
      true,
      pendingTasks.length <= 0 ? "No hay tareas pendientes" : null
    );
  }

  function updateStatsDOM(stats) {
    totalTasksCount.textContent = stats.total;
    completedCount.textContent = stats.completadas;
    pendingCount.textContent = stats.pendientes;
  }

  function setupPriorityToggle() {
    document.querySelectorAll('.prioridadOption input[type="radio"]').forEach((radio) => {
      radio.addEventListener("click", function() {
        if (this === selectedRadio) {
          this.checked = false;
          selectedRadio = null;
        } else {
          selectedRadio = this;
        }
      });
    });
  }

  // Funciones para UI
  function showCreateTaskModal() {
    clearDeleteModalBtn.classList.remove("eliminar");
    taskRender.showModal(modal);
  }

  function updateNameCounter() {
    messageRender.updateCounter(nameTask, tituloMensaje, 50);
  }

  function updateDescriptionCounter() {
    messageRender.updateCounter(taskDescription, messageDescription, 255);
  }

  // Funciones de eventos
  async function handlerTaskContainerEvents(event) {
    if (event.target.classList.contains("checkbox-completado")) {
      await handleCompletedTaskEvent(event);
    } else if (
      event.target.classList.contains("btn-eliminar") || 
      event.target.closest(".btn-eliminar")
    ) {
      await handleDeleteEvent(event);
    } else if (
      !event.target.classList.contains("checkbox-completado") &&
      !event.target.closest(".checkbox-label") &&
      event.target.closest(".principalTarea")
    ) {
      await showTaskDetailModal(event);
    }
  }

  async function handleCompletedTaskEvent(event) {
    const taskId = event.target.value;
    const taskElement = event.target.closest(".tarea");
    
    await  handleCompleteTask(taskId);
    await updateStatsAndRender();
    updateLists();
    
    const indice = pendingTasks.findIndex(t => t.taskId == taskId);
    if (indice !== -1) {
      taskRender.deleteSpecificRender(taskContainer, taskElement);
    }
  }

  async function handleDeleteEvent(event) {
    const deleteBtn = event.target.classList.contains("btn-eliminar")
      ? event.target
      : event.target.closest(".btn-eliminar");
    const taskId = deleteBtn.getAttribute("data-id");
    const userId = sessionStorage.getItem("userId");
    
    await handleDeleteTask(taskId, userId);
    await updateStatsAndRender();
    
    const divTaskDelete = document.querySelector(`#tareaDiv-${taskId}`);
    taskRender.deleteSpecificRender(taskContainer, divTaskDelete);
    
    cancel();
  }

  // async function showTaskDetailModal(event) {
  //   const taskElement = event.target.closest(".principalTarea");
  //   const searchedId = taskElement.id.replace("tarea-", "");
  //   event.stopPropagation();
    
  //   const taskDetail = pendingTasks.find(t => t.taskId == searchedId);
  //   if (!taskDetail) return;
    
  //   configModalForUpdate();
  //   taskRender.showTaskDetailModal(modal, taskDetail);
  //   tagsToUpdate = [...selectedTags];
  // }
  async function showTaskDetailModal(event) {
  const taskElement = event.target.closest(".principalTarea");
  const searchedId = taskElement.id.replace("task-", "");
  event.stopPropagation();
  
  const taskDetail = pendingTasks.find(t => t.id == searchedId);
  if (!taskDetail) return;
  
  // Limpiar y cargar las etiquetas existentes
  selectedTags.length = 0;
  if (taskDetail.tags && taskDetail.tags.length > 0) {
    taskDetail.tags.forEach(tag => {
      selectedTags.push(tag);
    });
  }
  
  configModalForUpdate();
  taskRender.showTaskDetailModal(modal, taskDetail);
  tagComponent.renderTags(tagsLists); // Asegurar que se rendericen
}

  function configModalForUpdate() {
    if (!addModalBtn.classList.contains("actualizarModal")) {
      addModalBtn.classList.add("actualizarModal");
      addModalBtn.textContent = "Actualizar";
      clearDeleteModalBtn.textContent = "Eliminar";
      clearDeleteModalBtn.classList.add("eliminar");
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!nameTask.value.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (addModalBtn.classList.contains("actualizarModal")) {
      await updateTaskListener();
    } else {
      await addTaskListener();
    }
  }

  async function clearDeleteModal() {
    if (clearDeleteModalBtn.classList.contains("eliminar")) {
      const taskId = nameTask.getAttribute("data-id");
      const userId = sessionStorage.getItem("userId");
      await handleDeleteTask(taskId, userId);
      await updateStatsAndRender();
    } else {
      clearFields();
    }
  }

  // Funciones de operaciones
  async function addTaskListener() {
    const tareaNueva = construirObjetoTarea();
    
    await handleCreateTask(tareaNueva);
    clearFields();
    await updateStatsAndRender();
    pendingBtnChecked(true);
    messageRender.showToast("Se ha guardado la tarea", false);
  }

  async function updateTaskListener() {
    const tareaActualizar = construirObjetoTareaActualizar();
    
    console.log("TAREA A ACTUALIZAR DESDE LISTENER: ", tareaActualizar);
    const tareaActualizada = await handleUpdateTask(tareaActualizar);
    console.log("DESDE LISTENER YA PROCESADA: ", tareaActualizada);
    await updateStatsAndRender();
    
    actualizarselectedTags(tareaActualizada);
    taskRender.updateTaskRender(taskContainer, tareaActualizada);
    updateLists();
    
    messageRender.showToast("Tag actualizada", false);
  }

  // CREAR MAPPERS APARTE 
  function construirObjetoTarea() {
    const prioridad = document.querySelector('input[name="priority"]:checked');
    const valorPrioridad = prioridad ? prioridad.value : null;
    const fechaProgramadaDateTime = taskScheduledDate.value ? taskScheduledDate.value : null;

    return {
      name: nameTask.value,
      description: taskDescription.value,
      scheduledDate: fechaProgramadaDateTime,
      createdAt: convertToMySQLDateTime(new Date()),
      lastUpdateDate: convertToMySQLDateTime(new Date()),
      isCompleted: false,
      userId: sessionStorage.getItem("userId"),
      priority: valorPrioridad,
      tags: selectedTags,
    };
  }

//   function construirObjetoTareaActualizar() {
//     const prioridad = document.querySelector('input[name="prioridad"]:checked');
//     const valorPrioridad = prioridad ? prioridad.value : null;
//     const fechaProgramadaValue = taskScheduledDate.value ? taskScheduledDate.value : null;
//     const fechaProgramadaProcesada = fechaProgramadaValue ? fechaProgramadaValue.replace('T', ' ') + ':00' : null;
//  //console.log("ACTUALIZAR ETIQUETAS", tagsToUpdate, selectedTags);
      
//     return {
//       taskId: nameTask.getAttribute("data-id"),
//       nombre: nameTask.value,
//       descripcion: taskDescription.value,
//       fechaProgramada: fechaProgramadaProcesada,
//       fechaUltimaActualizacion: convertToMySQLDateTime(new Date()),
//       userId: sessionStorage.getItem("userId"),
//       prioridad: valorPrioridad,
//       etiquetasAnteriores: tagsToUpdate,
//       etiquetasNuevas: selectedTags,
//     };


//   }
function construirObjetoTareaActualizar() {
  console.log("ETIQUETAS SELECCIONADAS DESDE TAREA LISTENER: ", selectedTags);
  const prioridad = document.querySelector('input[name="priority"]:checked');
  const valorPrioridad = prioridad ? prioridad.value : null;
  const fechaProgramadaValue = taskScheduledDate.value || null;
  const fechaProgramadaProcesada = fechaProgramadaValue
    ? fechaProgramadaValue.replace("T", " ") + ":00"
    : null;

  return {
    id: nameTask.getAttribute("data-id"),
    name: nameTask.value,
    description: taskDescription.value,
    scheduledDate: fechaProgramadaProcesada,
    lastUpdateDate: convertToMySQLDateTime(new Date()),
    userId: sessionStorage.getItem("userId"),
    priority: valorPrioridad,
    tags: [...selectedTags] // Copia de las tags actuales
  };
}

  function actualizarselectedTags(tareaActualizada) {
  
    selectedTags.length = 0;
    tareaActualizada.tags.forEach(element => {
      selectedTags.push(element);
    });
    tagsToUpdate = [...selectedTags];
   
  }

  function clearFields() {
    taskForm.reset();
    tagsLists.innerHTML = "";
    selectedTags.length = 0;
  }

  function cancel() {
    clearFields();
    // taskForm.reset();
    addModalBtn.classList.remove("actualizarModal");
    modal.style.display = "none";
  }
});