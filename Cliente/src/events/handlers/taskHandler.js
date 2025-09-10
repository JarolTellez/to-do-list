import {
  createTask,
  findAllTasksByUserId,
  completeTask,
  updateTask,
  deleteTask
} from "../../core/services/tasks.js";
import { taskRender } from "../../presentacion/componentes/taskRender.js";
import { messageRender } from "../../presentacion/componentes/messageRender.js";
import { pendingBtnChecked, updateLists } from "./filtersHandler.js";

export let pendingTasks = [];
export let completedTasks= [];

export async function updateTasksList() {
  const allTasks = await findAllTasksByUserId(
    sessionStorage.getItem("userId")
  );


  completedTasks= allTasks.completedTasks;
  pendingTasks = allTasks.pendingTasks;
  
}

export async function getStats() {
  await updateTasksList();
  return {
    total: completedTasks.length + pendingTasks.length,
    completadas: completedTasks.length,
    pendientes: pendingTasks.length
  };
}

export async function handleCreateTask(taskData) {
  try {
    const newTask = await createTask(taskData);
    pendingTasks.push(newTask);
    return newTask;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function handleDeleteTask(taskId, userId) {
  try {
    await deleteTask(taskId, userId);
    await updateTasksList();
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function handleUpdateTask(taskData) {
  try {
    const updatedTask = await updateTask(taskData);
    await updateTasksList();
    return updatedTask;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function handleCompleteTask(taskId, userId) {
  try {
    await completeTask(taskId, true, userId);
    await updateTasksList();
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export function convertToMySQLDateTime(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  const segundos = String(fecha.getSeconds()).padStart(2, '0');

  return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

function handleError(error) {
  if (error.status === "error" && Array.isArray(error.error)) {
    const mensajesError = error.error.map((err) => err.mensaje);
    messageRender.showToast(mensajesError.join('\n'), true);
  } else if (error.status === "error" && error.error) {
    messageRender.showToast(`Error: ${error.error}`, true);
  } else {
    messageRender.showToast('Ocurrió un error inesperado.', true);
  }
  console.error(error);
}