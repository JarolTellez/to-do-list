import {
  etiquetasSeleccionadas,
  componentesEtiquetas,
} from "../componentes/etiquetaRender.js";
import { rendersTareas } from "../componentes/tareaRender.js";
import {
  agregarTarea,
  consultarTareasUsuario,
  actualizarTareaCompletada,
  actualizarTarea,
} from "../servicios/tareas.js";

document.addEventListener("DOMContentLoaded", async function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const btnAgregarTareaPrincipal = document.querySelector(
    "#agregarTareaPrincipal"
  );
  const listaEtiquetas = document.querySelector("#listaEtiquetas");
  const campoTareas = document.querySelector("#listaTareas");
  const formTarea = document.querySelector("form");
  const btnLimpiarEliminarModal = document.querySelector(
    ".limpiarRestaurarModal"
  );
  const btnAgregarModal = document.querySelector(".agregarModal");
  const btnCancelarModal = document.querySelector(".cancelarModal");
  const modal = document.querySelector("#miModal");
  const modalOriginal = modal.innerHTML;

  //botones del modal
  const botonesContenedor = document.querySelector(".botonesModal");

  const tareas = await consultarTareasUsuario(
    sessionStorage.getItem("idUsuario")
  );

  btnAgregarTareaPrincipal.addEventListener("click", function () {
    rendersTareas.mostrarModal(modal);
  });

  /* Para manejar los clicks en de checkboxes para marcar como completado, se hace en el contenedor y se verifica si 
   se hizo click en el checbox para hacer la accion y asi funciona si agrego en tiempo de ejecucion mas tareas.*/
  campoTareas.addEventListener("click", function (event) {
    if (event.target.classList.contains("checkbox-completado")) {
      const tareaId = event.target.value;
      const indice = tareas.findIndex((tarea) => tarea.idTarea == tareaId);
      const tareaElemento = event.target.closest(".tarea");

      actualizarTareaCompletada(tareaId, true);
      if (indice !== -1) {
        tareas.splice(indice, 1);
        rendersTareas.eliminarRenderEspecifico(campoTareas, tareaElemento);
      }
    } else if (
      !event.target.classList.contains("checkbox-completado") &&
      !event.target.closest(".checkbox-label") &&
      event.target.closest(".principalTarea")
    ) {
      const tareaElemento = event.target.closest(".principalTarea");
      const idBuscado = tareaElemento.id;
      event.stopPropagation();
      const tareaDetalle = tareas.find((tarea) => tarea.idTarea == idBuscado);
      if (!btnAgregarModal.classList.contains("actualizarModal")) {
        btnAgregarModal.classList.add("actualizarModal");
        btnAgregarModal.textContent = "Actualizar";
        btnLimpiarEliminarModal.textContent = "Eliminar";
      }
    
      if (tareaDetalle) {
        rendersTareas.mostrarModalDetalleTarea(modal, tareaDetalle);
      }
    }
  });

 async function manejarEventosAgregarActualizar() {
    if (btnAgregarModal.classList.contains("actualizarModal")) {
        await manejarActualizarTarea();
    }else{

    await manejarAgregarTarea();
   
    }

  }

  
  formTarea.addEventListener("submit", async function (e) {
    e.preventDefault(); // Para que no se recargue la pagina

    if (!tituloTarea.value.trim()) {
      alert("El título es obligatorio");
      return; // Si no hay titulo, termina la ejecucion del submit
    }

    await manejarEventosAgregarActualizar();
  });

  btnLimpiarEliminarModal.addEventListener("click", function () {
    limpiarCampos();
  });

  rendersTareas.renderizarTareas(campoTareas, tareas);

  //PASARLO A RENDER TAREA
  btnCancelarModal.addEventListener("click", function () {
    limpiarCampos();
    btnAgregarModal.classList.remove("actualizarModal");
    modal.style.display = "none";
  });

  async function manejarAgregarTarea() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    //Se obtiene el valor solo si se selecciono una opcion, si no, entonces null, la prioridad es opcional
    const valorPrioridad = prioridad ? prioridad.value : null;

    const tareaNueva = {
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaCreacion: new Date().toISOString().slice(0, 19).replace("T", " "),
      fechaUltimaActualizacion: new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      completada: false,
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetas: etiquetasSeleccionadas,
    };

    try {
      const nuevaTarea = await agregarTarea(tareaNueva);

      limpiarCampos();
      tareas.push(nuevaTarea.data[0]);
      console.log(tareas);
      rendersTareas.renderizarTareas(campoTareas, nuevaTarea.data);

      alert("Se ha guardado correctamente la tarea");
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  }

  async function manejarEliminarTarea() {
    console.log("Eliminar Tarea");
  }

  async function manejarActualizarTarea() {
    console.log("Actualizar Tarea");
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    //Se obtiene el valor solo si se selecciono una opcion, si no, entonces null, la prioridad es opcional
    const valorPrioridad = prioridad ? prioridad.value : null;

    const tareaActualizar= {
      idTarea:tituloTarea.getAttribute("data-id"),
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaUltimaActualizacion: new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetas: etiquetasSeleccionadas,
    };

    try {
     const tareaActualizada= await actualizarTarea(tareaActualizar);
     rendersTareas.mostrarModalDetalleTarea(modal, tareaActualizada);
    } catch (error) {
      console.log(error);
      alert(error.message);
    }

  }

  function limpiarCampos() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');
    tituloTarea.value = "";
    descripcionTarea.value = "";
    if (prioridad) {
      prioridad.checked = false;
    }
    listaEtiquetas.innerHTML = "";
    etiquetasSeleccionadas.length = 0;
  }
});
