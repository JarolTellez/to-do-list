import {
  tareasPendientes,
  tareasCompletadas,
  actualizarListaTareas,
  obtenerEstadisticas,
  manejarAgregarTarea,
  manejarEliminarTarea,
  manejarActualizarTarea,
  manejarCompletarTarea,
  convertirADatetimeMysql
} from "../manejadores/tareasManejador.js";
import { rendersTareas } from "../../presentacion/componentes/tareaRender.js";
import { rendersMensajes } from "../../presentacion/componentes/mensajesRender.js";
import { etiquetasSeleccionadas, componentesEtiquetas } from "../../presentacion/componentes/etiquetaRender.js";
import { botonPendientesChecked, actualizarListas } from "../manejadores/filtrosManejador.js";

document.addEventListener("DOMContentLoaded", async function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const tituloMensaje = document.querySelector('#tituloMensaje');
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const descripcionMensaje = document.querySelector('#descripcionMensaje');
  const fechaProgramadaTarea = document.querySelector("#fechaInputModal");
  const btnAgregarTareaPrincipal = document.querySelector("#agregarTareaPrincipal");
  const listaEtiquetas = document.querySelector("#listaEtiquetas");
  const campoTareas = document.querySelector("#listaTareas");
  const formTarea = document.querySelector("form");
  const btnLimpiarEliminarModal = document.querySelector(".limpiarRestaurarModal");
  const btnAgregarModal = document.querySelector(".agregarModal");
  const btnCancelarModal = document.querySelector(".cancelarModal");
  const modal = document.querySelector("#miModal");
  const totalTareasP = document.querySelector("#total-tareas");
  const completadasP = document.querySelector("#completadas");
  const pendientesP = document.querySelector("#pendientes");
  const contenedorFiltros = document.querySelector(".filtros");

  let etiquetasParaActualizar;
  let selectedRadio = null;

  // Inicializar todo
  await inicializarAplicacion();

  // Event Listeners
  btnAgregarTareaPrincipal.addEventListener("click", mostrarModalAgregarTarea);
  tituloTarea.addEventListener('input', actualizarContadorTitulo);
  descripcionTarea.addEventListener('input', actualizarContadorDescripcion);
  campoTareas.addEventListener("click", manejarEventosCampoTareas);
  formTarea.addEventListener("submit", manejarSubmitFormulario);
  btnLimpiarEliminarModal.addEventListener("click", limpiarModalEliminar);
  btnCancelarModal.addEventListener("click", cancelar);

 
  async function inicializarAplicacion() {
    await actualizarEstadisticasYRender();
    deseleccionarPrioridad();
  }

  async function actualizarEstadisticasYRender() {
    const stats = await obtenerEstadisticas();
    actualizarEstadisticasDOM(stats);
    console.log("TAREAS PENDIENTES", tareasPendientes);
    rendersTareas.renderizarTareas(
      campoTareas, 
      tareasPendientes,
      true,
      tareasPendientes.length <= 0 ? "No hay tareas pendientes" : null
    );
  }

  function actualizarEstadisticasDOM(stats) {
    totalTareasP.textContent = stats.total;
    completadasP.textContent = stats.completadas;
    pendientesP.textContent = stats.pendientes;
  }

  function deseleccionarPrioridad() {
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
  function mostrarModalAgregarTarea() {
    btnLimpiarEliminarModal.classList.remove("eliminar");
    rendersTareas.mostrarModal(modal);
  }

  function actualizarContadorTitulo() {
    rendersMensajes.actualizarContador(tituloTarea, tituloMensaje, 50);
  }

  function actualizarContadorDescripcion() {
    rendersMensajes.actualizarContador(descripcionTarea, descripcionMensaje, 255);
  }

  // Funciones de eventos
  async function manejarEventosCampoTareas(event) {
    if (event.target.classList.contains("checkbox-completado")) {
      await manejarEventoTareaCompletada(event);
    } else if (
      event.target.classList.contains("btn-eliminar") || 
      event.target.closest(".btn-eliminar")
    ) {
      await manejarEventoEliminar(event);
    } else if (
      !event.target.classList.contains("checkbox-completado") &&
      !event.target.closest(".checkbox-label") &&
      event.target.closest(".principalTarea")
    ) {
      await mostrarDetalleTarea(event);
    }
  }

  async function manejarEventoTareaCompletada(event) {
    const tareaId = event.target.value;
    const tareaElemento = event.target.closest(".tarea");
    
    await manejarCompletarTarea(tareaId);
    await actualizarEstadisticasYRender();
    actualizarListas();
    
    const indice = tareasPendientes.findIndex(t => t.idTarea == tareaId);
    if (indice !== -1) {
      rendersTareas.eliminarRenderEspecifico(campoTareas, tareaElemento);
    }
  }

  async function manejarEventoEliminar(event) {
    const btnEliminar = event.target.classList.contains("btn-eliminar")
      ? event.target
      : event.target.closest(".btn-eliminar");
    const tareaId = btnEliminar.getAttribute("data-id");
    const idUsuario = sessionStorage.getItem("idUsuario");
    
    await manejarEliminarTarea(tareaId, idUsuario);
    await actualizarEstadisticasYRender();
    
    const tareaElementoEliminar = document.querySelector(`#tareaDiv-${tareaId}`);
    rendersTareas.eliminarRenderEspecifico(campoTareas, tareaElementoEliminar);
    
    cancelar();
  }

  async function mostrarDetalleTarea(event) {
    const tareaElemento = event.target.closest(".principalTarea");
    const idBuscado = tareaElemento.id.replace("tarea-", "");
    event.stopPropagation();
    
    const tareaDetalle = tareasPendientes.find(t => t.idTarea == idBuscado);
    if (!tareaDetalle) return;
    
    configurarModalParaActualizar();
    rendersTareas.mostrarModalDetalleTarea(modal, tareaDetalle);
    etiquetasParaActualizar = [...etiquetasSeleccionadas];
  }

  function configurarModalParaActualizar() {
    if (!btnAgregarModal.classList.contains("actualizarModal")) {
      btnAgregarModal.classList.add("actualizarModal");
      btnAgregarModal.textContent = "Actualizar";
      btnLimpiarEliminarModal.textContent = "Eliminar";
      btnLimpiarEliminarModal.classList.add("eliminar");
    }
  }

  async function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    if (!tituloTarea.value.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (btnAgregarModal.classList.contains("actualizarModal")) {
      await actualizarTareaListener();
    } else {
      await agregarTareaListener();
    }
  }

  async function limpiarModalEliminar() {
    if (btnLimpiarEliminarModal.classList.contains("eliminar")) {
      const idTarea = tituloTarea.getAttribute("data-id");
      const idUsuario = sessionStorage.getItem("idUsuario");
      await manejarEliminarTarea(idTarea, idUsuario);
      await actualizarEstadisticasYRender();
    } else {
      limpiarCampos();
    }
  }

  // Funciones de operaciones
  async function agregarTareaListener() {
    const tareaNueva = construirObjetoTarea();
    
    await manejarAgregarTarea(tareaNueva);
    limpiarCampos();
    await actualizarEstadisticasYRender();
    botonPendientesChecked(true);
    rendersMensajes.mostrarToast("Se ha guardado la tarea", false);
  }

  async function actualizarTareaListener() {
    const tareaActualizar = construirObjetoTareaActualizar();
    console.log("objeto:", tareaActualizar);
    
    const tareaActualizada = await manejarActualizarTarea(tareaActualizar);
    await actualizarEstadisticasYRender();
    
    actualizarEtiquetasSeleccionadas(tareaActualizada);
    rendersTareas.actualizarRenderTarea(campoTareas, tareaActualizada);
    actualizarListas();
    
    rendersMensajes.mostrarToast("Tarea actualizada", false);
  }

  function construirObjetoTarea() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');
    const valorPrioridad = prioridad ? prioridad.value : null;
    const fechaProgramadaDateTime = fechaProgramadaTarea.value ? fechaProgramadaTarea.value : null;

    return {
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaProgramada: fechaProgramadaDateTime,
      fechaCreacion: convertirADatetimeMysql(new Date()),
      fechaUltimaActualizacion: convertirADatetimeMysql(new Date()),
      completada: false,
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetas: etiquetasSeleccionadas,
    };
  }

  function construirObjetoTareaActualizar() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');
    const valorPrioridad = prioridad ? prioridad.value : null;
    const fechaProgramadaValue = fechaProgramadaTarea.value ? fechaProgramadaTarea.value : null;
    const fechaProgramadaProcesada = fechaProgramadaValue ? fechaProgramadaValue.replace('T', ' ') + ':00' : null;
 console.log("ACTUALIZAR ETIQUETAS", etiquetasParaActualizar, etiquetasSeleccionadas);
    return {
      idTarea: tituloTarea.getAttribute("data-id"),
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaProgramada: fechaProgramadaProcesada,
      fechaUltimaActualizacion: convertirADatetimeMysql(new Date()),
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetasAnteriores: etiquetasParaActualizar,
      etiquetasNuevas: etiquetasSeleccionadas,
    };
  }

  function actualizarEtiquetasSeleccionadas(tareaActualizada) {
    etiquetasSeleccionadas.length = 0;
    tareaActualizada.etiquetas.forEach(element => {
      etiquetasSeleccionadas.push(element);
    });
    etiquetasParaActualizar = [...etiquetasSeleccionadas];
   
  }

  function limpiarCampos() {
    formTarea.reset();
    listaEtiquetas.innerHTML = "";
    etiquetasSeleccionadas.length = 0;
  }

  function cancelar() {
    limpiarCampos();
    btnAgregarModal.classList.remove("actualizarModal");
    modal.style.display = "none";
  }
});