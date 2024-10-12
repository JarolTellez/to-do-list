import {
  etiquetasSeleccionadas,
  componentesEtiquetas,
} from "../componentes/etiquetaRender.js";
import { rendersTareas } from "../componentes/tareaRender.js";
import {
  agregarTarea,
  consultarTareasUsuario,
  actualizarTareaCompletada,
} from "../servicios/tareas.js";

document.addEventListener("DOMContentLoaded", async function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const btnAgregarTareaPrincipal = document.querySelector("#agregarTareaPrincipal");
  const listaEtiquetas = document.querySelector("#listaEtiquetas");
  const campoTareas = document.querySelector("#listaTareas");
  const formTarea = document.querySelector("form");
  const btnCancelarModal = document.querySelector(".cancelarModal");
  const modal = document.querySelector("#miModal");
  const modalOriginal=modal.innerHTML;
 

  const tareas = await consultarTareasUsuario(
    sessionStorage.getItem("idUsuario")
  );

  btnAgregarTareaPrincipal.addEventListener("click",function(){

   rendersTareas.mostrarModal(modal);
  })

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
      !event.target.closest(".checkbox-label")&&
      event.target.closest(".principalTarea") 
    ) {
      const tareaElemento = event.target.closest(".principalTarea");
        const idBuscado = tareaElemento.id;
        event.stopPropagation();
        const tareaDetalle = tareas.find((tarea) => tarea.idTarea == idBuscado);
        if (tareaDetalle) {
          rendersTareas.mostrarModalDetalleTarea(
            modal,
            tareaDetalle
          );
        }
      
    }
  });

 
  rendersTareas.renderizarTareas(campoTareas, tareas);

  formTarea.addEventListener("submit", async function (e) {
    e.preventDefault(); // Para que no se recargue la pagina

    if (!tituloTarea.value.trim()) {
      alert("El título es obligatorio");
      return; // Si no hay titulo, termina la ejecucion del submit
    }

    await manejarAgregarTarea();
  });

  btnCancelarModal.addEventListener("click", function () {
    limpiarCampos();
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
