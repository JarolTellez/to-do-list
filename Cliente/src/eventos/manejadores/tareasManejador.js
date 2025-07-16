import {
  agregarTarea,
  consultarTareasUsuario,
  actualizarTareaCompletada,
  actualizarTarea,
  eliminarTarea
} from "../../core/servicios/tareas.js";
import { rendersTareas } from "../../presentacion/componentes/tareaRender.js";
import { rendersMensajes } from "../../presentacion/componentes/mensajesRender.js";
import { botonPendientesChecked, actualizarListas } from "../manejadores/filtrosManejador.js";

export let tareasPendientes = [];
export let tareasCompletadas = [];

export async function actualizarListaTareas() {
  const todasTareas = await consultarTareasUsuario(
    sessionStorage.getItem("idUsuario")
  );
  tareasCompletadas = todasTareas.tareasCompletadas;
  tareasPendientes = todasTareas.tareasPendientes;
}

export async function obtenerEstadisticas() {
  await actualizarListaTareas();
  return {
    total: tareasCompletadas.length + tareasPendientes.length,
    completadas: tareasCompletadas.length,
    pendientes: tareasPendientes.length
  };
}

export async function manejarAgregarTarea(tareaData) {
  try {
    const nuevaTarea = await agregarTarea(tareaData);
    tareasPendientes.push(nuevaTarea.data[0]);
    return nuevaTarea;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function manejarEliminarTarea(idTarea, idUsuario) {
  try {
    await eliminarTarea(idTarea, idUsuario);
    await actualizarListaTareas();
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function manejarActualizarTarea(tareaData) {
  try {
    const tareaActualizada = await actualizarTarea(tareaData);
    await actualizarListaTareas();
    return tareaActualizada;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function manejarCompletarTarea(tareaId) {
  try {
    await actualizarTareaCompletada(tareaId, true);
    await actualizarListaTareas();
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export function convertirADatetimeMysql(fecha) {
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
    rendersMensajes.mostrarToast(mensajesError.join('\n'), true);
  } else if (error.status === "error" && error.error) {
    rendersMensajes.mostrarToast(`Error: ${error.error}`, true);
  } else {
    rendersMensajes.mostrarToast('Ocurrió un error inesperado.', true);
  }
  console.error(error);
}