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
  eliminarTarea
} from "../servicios/tareas.js";

import {botonPendientesChecked,
  actualizarListas} from "../eventos/filtrosEventos.js";

export let tareasPendientes=[];
export let tareasCompletadas=[];

 
export async function actualizarListaTareas(){
  const todasTareas = await consultarTareasUsuario(
    sessionStorage.getItem("idUsuario")
  );
  // tareasPendientes.length=0;
  // todasTareas.tareasPendientes.forEach(element => {
  //   tareasPendientes.push(element);
  // });
  // tareasCompletadas.length=0;
  // todasTareas.tareasCompletadas.forEach(element => {
  //   tareasCompletadas.push(element);
  // });
  tareasCompletadas=todasTareas.tareasCompletadas;
  tareasPendientes=todasTareas.tareasPendientes;

}

document.addEventListener("DOMContentLoaded", async function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const fechaProgramadaTarea=document.querySelector("#fechaInputModal");
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
  const botonesContenedor = document.querySelector(".botonesModal");

  //ESTADISTICAS
  const totalTareasP=document.querySelector("#total-tareas");
  const completadasP=document.querySelector("#completadas");
  const pendientesP=document.querySelector("#pendientes");

 //FILTRO
 const contenedorFiltros=document.querySelector(".filtros");


  let etiquetasParaActualizar;



 //Consulta tareas, actualiza las listas de consultadas y pendientes y actualiza las estadisticas
 await actualizarEstadisticas();

  //console.log("Tareas Pendientes",tareasPendientes);
  //console.log("Todas las tareas", tareasPendientes.todasLasTareas)

  //Para iterarar y encontrar el radio seleccionado
  let selectedRadio = null;

  

  function deseleccionarPrioridad() {
    document
      .querySelectorAll('.prioridadOption input[type="radio"]')
      .forEach((radio) => {
        radio.addEventListener("click", function () {
          // Si ya está seleccionado y es el mismo que el anterior
          if (this === selectedRadio) {
            this.checked = false; // Deseleccionar
            selectedRadio = null; // Reiniciar selección
          } else {
            selectedRadio = this; // Actualizar el radio seleccionado
          }
        });
      });
  }
  deseleccionarPrioridad();

  btnAgregarTareaPrincipal.addEventListener("click", function () {
    btnLimpiarEliminarModal.classList.remove("eliminar");
    rendersTareas.mostrarModal(modal);
  });


  /* Para manejar los clicks en de checkboxes para marcar como completado, se hace en el contenedor y se verifica si 
   se hizo click en el checbox para hacer la accion y asi funciona si agrego en tiempo de ejecucion mas tareas.*/
  campoTareas.addEventListener("click", async function (event) {
    //  tareas = await consultarTareasUsuario(sessionStorage.getItem("idUsuario"));

    if (event.target.classList.contains("checkbox-completado")) {
      const tareaId = event.target.value;
      const indice = tareasPendientes.findIndex((tarea) => tarea.idTarea == tareaId);
      const tareaElemento = event.target.closest(".tarea");

      await actualizarTareaCompletada(tareaId, true);
      
      //Consulta tareas, actualiza las listas de consultadas y pendientes y actualiza las estadisticas
      await actualizarEstadisticas();
      if (indice !== -1) {
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
      const tareaDetalle = tareasPendientes.find((tarea) => tarea.idTarea == idBuscado);
      if (!btnAgregarModal.classList.contains("actualizarModal")) {
        btnAgregarModal.classList.add("actualizarModal");
        btnAgregarModal.textContent = "Actualizar";
        btnLimpiarEliminarModal.textContent = "Eliminar";
        btnLimpiarEliminarModal.classList.add("eliminar");
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

  async function manejarLimpiarEliminar() {
    if (btnLimpiarEliminarModal.classList.contains("eliminar")) {
      await manejarEliminarTarea();
    } else {
     limpiarCampos();
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

  btnLimpiarEliminarModal.addEventListener("click", async function () {
    //limpiarCampos();
    manejarLimpiarEliminar(event);
  });

  rendersTareas.renderizarTareas(campoTareas, tareasPendientes,true,tareasPendientes.length<=0?"No hay tareas pendientes":null);

  //PASARLO A RENDER TAREA
  btnCancelarModal.addEventListener("click", function () {
    cancelar();
  });

function cancelar(){
  limpiarCampos();
  btnAgregarModal.classList.remove("actualizarModal");
  modal.style.display = "none";
}

async function actualizarEstadisticas(){
  await actualizarListaTareas();
  console.log("PENDIENYTES AGREGADAS",tareasPendientes);
totalTareasP.textContent=(tareasCompletadas.length+tareasPendientes.length);
completadasP.textContent=tareasCompletadas.length;
pendientesP.textContent=tareasPendientes.length;
}

  async function manejarAgregarTarea() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    //Se obtiene el valor solo si se selecciono una opcion, si no, entonces null, la prioridad es opcional
    const valorPrioridad = prioridad ? prioridad.value : null;
    // Se obtiene el valor de la fecha solo si se selecciono una si no, se envia null
    const fechaProgramadaDateTime= fechaProgramadaTarea.value? fechaProgramadaTarea.value:null;
   
 
    const tareaNueva = {
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaProgramada:fechaProgramadaDateTime,
      fechaCreacion: convertirADatetimeMysql(new Date()),
      fechaUltimaActualizacion:convertirADatetimeMysql(new Date()),
      completada: false,
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetas: etiquetasSeleccionadas,
    };

    console.log(tareaNueva);
    try {
      const nuevaTarea = await agregarTarea(tareaNueva);

      limpiarCampos();
      tareasPendientes.push(nuevaTarea.data[0]);
      console.log(tareasPendientes);
     //Consulta tareas, actualiza las listas de consultadas y pendientes y actualiza las estadisticas
     await actualizarEstadisticas();

     //const tieneFiltro=contenedorFiltros.classList.contains("filtro");

    //  rendersTareas.renderizarTareas(campoTareas,tieneFiltro?tareasPendientes:nuevaTarea.data,tieneFiltro?true:false);
    //rendersTareas.renderizarTareas(campoTareas,tareasPendientes,true);
      botonPendientesChecked(true);
      
      // //Verifico si se aplico un filtro antes de que se intentara agregar la tarea
      // if(tieneFiltro){
      //     //Quito la clase filtro al contenedor de los filtros para indicar que se volvio al estado de tareas pendientes que son las que se muestran
      //     //cuando se agrega una tarea
      //   contenedorFiltros.classList.remove("filtro");
      // }
     

      alert("Se ha guardado correctamente la tarea");
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  }

  async function manejarEliminarTarea() {
    console.log("Eliminar Tarea");
    try {
      const idTarea=tituloTarea.getAttribute("data-id");
    await eliminarTarea(idTarea,sessionStorage.getItem("idUsuario"));
    //Vuelvo a cargar las tareas
  await actualizarEstadisticas();
    //Elimino el elemento render de la tarea, recupero el elemento del dom que coincide con el idTarea para mandarlo eliminar
    const tareaElementoEliminar = document.querySelector(`#tareaDiv-${idTarea}`);
    rendersTareas.eliminarRenderEspecifico(campoTareas, tareaElementoEliminar);

    //Cierro y limpio el modal
    cancelar();
      
    alert("Tarea eliminada")
  } catch (error) {
    console.log(error);
    alert(error.message);
  }


  }

  async function manejarActualizarTarea() {
    console.log("Actualizar Tarea", etiquetasParaActualizar);
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    //Se obtiene el valor solo si se selecciono una opcion, si no, entonces null, la prioridad es opcional
    const valorPrioridad = prioridad ? prioridad.value : null;

    const fechaProgramadaValue= fechaProgramadaTarea.value? fechaProgramadaTarea.value:null;
    const fechaProgramadaProcesada= fechaProgramadaValue?fechaProgramadaValue.replace('T', ' ') + ':00':null;


    const tareaActualizar = {
      idTarea: tituloTarea.getAttribute("data-id"),
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaProgramada:fechaProgramadaProcesada,
      fechaUltimaActualizacion: convertirADatetimeMysql(new Date()),
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetasAnteriores: etiquetasParaActualizar,
      etiquetasNuevas: etiquetasSeleccionadas,
    };

 
    // console.log("ANTERIORES eventos", etiquetasParaActualizar);
    // console.log("NUEVAS eventos", etiquetasSeleccionadas);

    try {
      const tareaActualizada = await actualizarTarea(tareaActualizar);
      //Consulto las tareas de nuevo para tenerlas actualizadas
     
      //Consulta tareas, actualiza las listas de consultadas y pendientes y actualiza las estadisticas
      await actualizarEstadisticas();
  

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

      //Aqui llamar al metodo
      actualizarListas();
      
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  }

  function limpiarCampos() {
    formTarea.reset();
    listaEtiquetas.innerHTML = "";
    etiquetasSeleccionadas.length = 0;
  }

  function convertirADatetimeMysql(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Los meses comienzan en 0
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');

    return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

// function convertirAFormatoDateTimeLocal(fechaOriginal) {
//   const fecha=new Date(fechaOriginal);
//   const anio = fecha.getFullYear();
//   const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Los meses comienzan en 0
//   const dia = String(fecha.getDate()).padStart(2, '0');
//   const horas = String(fecha.getHours()).padStart(2, '0');
//   const minutos = String(fecha.getMinutes()).padStart(2, '0');
//   const segundos = String(fecha.getSeconds()).padStart(2, '0');

//   return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
// }
});

