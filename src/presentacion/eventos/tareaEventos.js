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

  let etiquetasParaActualizar;

  let tareas = await consultarTareasUsuario(
    sessionStorage.getItem("idUsuario")
  );

  btnAgregarTareaPrincipal.addEventListener("click", function () {
    rendersTareas.mostrarModal(modal);
  });

  /* Para manejar los clicks en de checkboxes para marcar como completado, se hace en el contenedor y se verifica si 
   se hizo click en el checbox para hacer la accion y asi funciona si agrego en tiempo de ejecucion mas tareas.*/
  campoTareas.addEventListener("click", async function (event) {
  //  tareas = await consultarTareasUsuario(sessionStorage.getItem("idUsuario"));

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
      const idCompleto = tareaElemento.id;
      // Elimina  "tarea-" para obtener solo el id de la tarea del elemento html cargado dinamicamente para mostrar cada una de las tareas
      const idBuscado = idCompleto.replace("tarea-", "");

      event.stopPropagation();
      const tareaDetalle = tareas.find((tarea) => tarea.idTarea == idBuscado);
      if (!btnAgregarModal.classList.contains("actualizarModal")) {
        btnAgregarModal.classList.add("actualizarModal");
        btnAgregarModal.textContent = "Actualizar";
        btnLimpiarEliminarModal.textContent = "Eliminar";
      }
      console.log("TAREA DETALLE", tareaDetalle);
      if (tareaDetalle) {
        rendersTareas.mostrarModalDetalleTarea(modal, tareaDetalle);
      }
      etiquetasParaActualizar = [...etiquetasSeleccionadas];
    }
  });

  async function manejarEventosAgregarActualizar() {
    if (btnAgregarModal.classList.contains("actualizarModal")) {
      await manejarActualizarTarea();
    } else {
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
    console.log("Actualizar Tarea", etiquetasParaActualizar);
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    //Se obtiene el valor solo si se selecciono una opcion, si no, entonces null, la prioridad es opcional
    const valorPrioridad = prioridad ? prioridad.value : null;

    const tareaActualizar = {
      idTarea: tituloTarea.getAttribute("data-id"),
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaUltimaActualizacion: new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetasAnteriores: etiquetasParaActualizar,
      etiquetasNuevas: etiquetasSeleccionadas,
    };

    console.log("ANTERIORES eventos", etiquetasParaActualizar);
    console.log("NUEVAS eventos", etiquetasSeleccionadas);

    try {
      
      const tareaActualizada = await actualizarTarea(tareaActualizar);
     

      //Consulto las tareas de nuevo para tenerlas actualizadas
      const tareasActualizadas = await consultarTareasUsuario(
        sessionStorage.getItem("idUsuario")
      );
      tareas = tareasActualizadas;

      //Elimino todas las tareas de etiquetasSeleccionadas para volverlo a llenar
      etiquetasSeleccionadas.length = 0;
      // agrego a etiquetas seleccionadas las etiquetas actuales de la tarea es decir
      // las etiquetas que se actualizaron(guardaron la bd despues de actualizar las etiquetas de la tarea)
      tareaActualizada.etiquetas.forEach((element) => {
        etiquetasSeleccionadas.push(element);
      });

      //Envio a actualizar el render de la tarea, es decir una tarea en especifico, le paso el campo tareas que es
      //donde se se agregan dinamicamente las tareas cada una al agregarla en un campo se le agrega el id de la tarea
      //y le paso la tarea que regreso el metodo de actualizar es decir
      //la tarea actualizada para que busque en el campo tareas el elemento que coincida con el id de la tareaActualizada y carge
      // todos los datos de la tareaActualizada en el elemento html que le corresponda
      rendersTareas.actualizarRenderTarea(campoTareas, tareaActualizada);
      etiquetasParaActualizar = [...etiquetasSeleccionadas];

      alert("Se actualizo la tarea");
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
