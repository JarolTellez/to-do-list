import {
  tareasPendientes,
  tareasCompletadas,
  actualizarListaTareas,
} from "../manejadores/tareasManejador.js";
import { rendersTareas } from "../../presentacion/componentes/tareaRender.js";
import { rendersMensajes } from "../../presentacion/componentes/mensajesRender.js";
import { FiltradoOrdenamiento } from "../../filtradoOrdenamiento.js";
import { TareaPendienteEspecificacion } from "../../filtros/tareaPendienteEspecificacion.js";
import { TareaCompletadaEspecificacion } from "../../filtros/tareaCompletadaEspecificacion.js";
import { TareaParaHoyEspecificacion } from "../../filtros/tareaParaHoyEspecificacion.js";
import { OrdenarPorFechaAsc } from "../../ordenamiento/ordenarPorFechaAsc.js";
import { OrdenarPorFechaDesc } from "../../ordenamiento/ordenarPorFechaDesc.js";
import { OrdenarPorPrioridadAsc } from "../../ordenamiento/ordenarPorPrioridadAsc.js";
import { OrdenarPorPrioridadDesc } from "../../ordenamiento/ordenarPorPrioridadDesc.js";

// Variables globales
let tareasPendientesButton, tareasCompletadasButton;
let prioridadMayorButton, prioridadMenorButton;
let campoTareas;
let contenedorFiltros;
let tareasParaHoyFiltroButton;
let tareasProximasButton;
let radioPrioridadFiltro = null;
let radioProgramadasFiltro = null;
let tareasRenderizadasActuales;
let tareasConFiltroPrioridadActuales;

const ordenador = new FiltradoOrdenamiento();
//ordenador.setFiltro(new TareaPendienteEspecificacion());

export function botonPendientesChecked(seleccionado) {
  tareasPendientesButton.checked =
    seleccionado && seleccionado == true ? true : false;
  tareasPendientesButton.checked = true;
  tareasPendientesButton.closest(".radio").classList.add("selected");
  tareasCompletadasButton.checked = false;
  tareasCompletadasButton.closest(".radio").classList.remove("selected");

  const filtroEspecial = new TareaParaHoyEspecificacion();
  const tareasHoy = tareasPendientes.filter((tarea) =>
    filtroEspecial.cumple(tarea)
  );
  if (tareasPendientesButton.checked && tareasHoy.length <= 0) {
    if (radioProgramadasFiltro) {
      tareasParaHoyFiltroButton.checked = false;
      tareasParaHoyFiltroButton.closest(".radio").classList.remove("selected");
      radioProgramadasFiltro = null;
    }
  }

  actualizarListas();
}

export async function actualizarListas() {
 
  let mensaje = null;
  let mensajeFlotante = "No hay tareas para aplicar filtros";

  let filtroBase;
  if (tareasCompletadasButton.checked) {
    filtroBase = new TareaCompletadaEspecificacion();
    if (tareasCompletadas.length <= 0) {
      mensaje = "No hay tareas completadas";
      desactivarFiltros();
      desactivarFiltrosDePrioridad();
    }
  } else if (tareasPendientesButton.checked) {
    filtroBase = new TareaPendienteEspecificacion();
    if (tareasPendientes.length <= 0) {
      mensaje = "No hay tareas pendientes";
      desactivarFiltros();
      desactivarFiltrosDePrioridad();
      rendersMensajes.mostrarToast(mensajeFlotante, true);
    }
  }

  ordenador.limpiarOrdenamientos();

  if (prioridadMayorButton.checked && radioPrioridadFiltro) {
    ordenador.agregarOrdenamiento(new OrdenarPorPrioridadDesc());
  } else if (prioridadMenorButton.checked && radioPrioridadFiltro) {
    ordenador.agregarOrdenamiento(new OrdenarPorPrioridadAsc());
  }

  if (tareasProximasButton.checked) {
    ordenador.agregarOrdenamiento(new OrdenarPorFechaDesc());
  }

  let filtroAdicional = null;
  if (tareasParaHoyFiltroButton.checked) {
    filtroAdicional = new TareaParaHoyEspecificacion();
  }

  if (filtroBase && filtroAdicional) {
    const combinacion = await filtroBase.and(filtroAdicional);
    ordenador.setFiltro(combinacion);
  } else {
    ordenador.setFiltro(filtroBase);
  }

  const tareasAProcesar = tareasCompletadasButton.checked
    ? tareasCompletadas
    : tareasPendientes;
    console.log("TAREAS A PROCESAR: ", tareasAProcesar);
/////////////////////////////////////////////////////////////////////////////////
  tareasRenderizadasActuales = ordenador.ordenar(tareasAProcesar);

  if (tareasRenderizadasActuales.length === 0 && filtroAdicional) {
    mensaje = tareasParaHoyFiltroButton.checked
      ? "No hay tareas para hoy"
      : "No hay tareas próximas";
  }

  console.log("TAREAS DESDE ACTUALIZAR LISTAS: ", tareasRenderizadasActuales);
  rendersTareas.renderizarTareas(
    campoTareas,
    tareasRenderizadasActuales,
    true,
    mensaje
  );
}

function desactivarFiltros() {
  prioridadMayorButton.checked = false;
  prioridadMenorButton.checked = false;
  tareasParaHoyFiltroButton.checked = false;
  tareasProximasButton.checked = false;

  prioridadMayorButton.closest(".radio").classList.remove("selected");
  prioridadMenorButton.closest(".radio").classList.remove("selected");
  tareasParaHoyFiltroButton.closest(".radio").classList.remove("selected");
  tareasProximasButton.closest(".radio").classList.remove("selected");
}

function desactivarFiltrosDePrioridad() {
  prioridadMayorButton.checked = false;
  prioridadMenorButton.checked = false;

  prioridadMayorButton.closest(".radio").classList.remove("selected");
  prioridadMenorButton.closest(".radio").classList.remove("selected");
}

function deseleccionarPrioridad() {
  document
    .querySelectorAll('.contenedorFiltroPrioridad input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        if (this === radioPrioridadFiltro) {
          this.closest(".radio").classList.remove("selected");
          this.checked = false;
          radioPrioridadFiltro = null;
          actualizarListas();
        } else if (tareasRenderizadasActuales.length > 0) {
          radioPrioridadFiltro = this;
        }
      });
    });

  if (tareasConFiltroPrioridadActuales) {
    tareasConFiltroPrioridadActuales.length = 0;
  }
}

function deseleccionarTareasParaHoy() {
  document
    .querySelectorAll('.contenedorFiltroProgramadas input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        if (this === radioProgramadasFiltro) {
          this.closest(".radio").classList.remove("selected");
          this.checked = false;
          tareasParaHoyFiltroButton.checked = false;
          radioProgramadasFiltro = null;
          actualizarListas();
        } else {
          radioProgramadasFiltro = this;
        }
      });
    });
}

function cargarModoBase() {
  tareasPendientesButton.checked = true;
  tareasPendientesButton.closest(".radio").classList.add("selected");
  tareasRenderizadasActuales = [...tareasPendientes];
}

export function inicializarManejadores() {
  campoTareas = document.querySelector("#listaTareas");
  contenedorFiltros = document.querySelector(".filtros");
  tareasPendientesButton = document.querySelector("#tareasPendientesFiltro");
  tareasCompletadasButton = document.querySelector("#tareasCompletadasFiltro");
  prioridadMayorButton = document.querySelector("#prioridadMayorFiltro");
  prioridadMenorButton = document.querySelector("#prioridadMenorFiltro");
  tareasParaHoyFiltroButton = document.querySelector("#tareasParaHoyFiltro");
  tareasProximasButton = document.querySelector("#tareasProximasFiltro");

  deseleccionarPrioridad();
  deseleccionarTareasParaHoy();
  cargarModoBase();
}

export function getTareasRenderizadas() {
  return [...tareasRenderizadasActuales]; // s devuelvo copia
}
