import {
  tareasPendientes,
  tareasCompletadas,
  actualizarListaTareas,
} from "../eventos/tareaEventos.js";
import { rendersTareas } from "../componentes/tareaRender.js";

//Para guardar el boton para filtrar por tareas pendientes para poder usarla en la funcion
//que exporto abajo "botonPendientesChecked" ;e establezco el valor en el "DOMContentLoaded"
let tareasPendientesButton, tareasCompletadasButton;
let prioridadMayorButton, prioridadMenorButton;
let campoTareas;
let contenedorFiltros;
let tareasParaHoyFiltroButton;
let tareasProximasButton;

let radioPrioridadFiltro = null;
//Variable para guardar el estado de las opciones del filtro de filtrar por fecha programada
let  radioProgramadasFiltro = null;
//Variable para guardar toda la label que adentro tiene tanto el input del filtro pars hoy
//como el span con el texto
let filtroProgramadasLabel = null;
let contenedorFiltroProgramadas = null;
let tareasRenderizadasActuales;
let tareasConFiltroPrioridadActuales;
// let estadoPendientesButton = false;
// let estadoCompletadasButton = false;
// let filtroParaHoy = false;

let tareasRenderizarParaHoy = [];

// Metodo que se llama desde tareaEventos cuando se agrega una tarea para mostrar las tareas pendientes
// y quitar el filtro para hoy y el de completadas si estan seleccionado
export function botonPendientesChecked(seleccionado) {
  tareasPendientesButton.checked =
    seleccionado && seleccionado == true ? true : false;
    tareasPendientesButton.checked=true;
    tareasPendientesButton.closest('.radio').classList.add('selected');

    tareasCompletadasButton.checked=false;
    tareasCompletadasButton.closest('.radio').classList.remove('selected');

   tareasParaHoyFiltroButton.checked=false;
   tareasParaHoyFiltroButton.closest('.radio').classList.remove('selected');


  // if (prioridadMayorButton.checked || prioridadMayorButton.checked) {
    // prioridadMayor();
    actualizarListas();
  // }
}

export function actualizarListas() {
  let mensaje;
  // Inicializar con las tareas pendientes o completadas según el filtro seleccionado
  if (tareasCompletadasButton.checked) {
    tareasRenderizadasActuales = [...tareasCompletadas]
    if(tareasCompletadas.length<=0){
      mensaje="No hay tareas completadas";
    }
    
  } else if (tareasPendientesButton.checked ) {
    tareasRenderizadasActuales = [...tareasPendientes]
    if(tareasPendientes.length<=0){
      mensaje="No hay tareas pendientes";
    }
  }

  // Aplicar filtro de prioridad si está seleccionado
  if (radioPrioridadFiltro !== null) {
    if (
      radioPrioridadFiltro.value === "mayor" ||
      prioridadMayorButton.checked
    ) {
      tareasRenderizadasActuales = ordenarMayorMenor(
        tareasRenderizadasActuales
      );
    } else if (
      radioPrioridadFiltro.value === "menor" ||
      prioridadMenorButton.checked
    ) {
      tareasRenderizadasActuales = ordenarMenorMayor(
        tareasRenderizadasActuales
      );
    }
  }

  // Aplicar filtro "para hoy" si está seleccionado
  if ( radioProgramadasFiltro!==null && tareasParaHoyFiltroButton.checked) {
    console.log("entro a hoy AAAAAAAAAA");
  
    if (tareasRenderizadasActuales.length <= 0) {
      mensaje = "No hay tareas para hoy";
    
    }
      tareasRenderizadasActuales = ordenarParaHoy(tareasRenderizadasActuales);
     
   
  
   // return; // Salir de la función después de aplicar el filtro "para hoy"
  }

   // Aplicar filtro "para hoy" si está seleccionado
   if ( tareasProximasButton.checked) {
    console.log("entro a Proximas");
    tareasRenderizadasActuales = ordenarMasProximas(tareasRenderizadasActuales);
    if (tareasRenderizadasActuales.length <= 0) {
      mensaje = "No hay tareas proximas";
  
    }
  }

  // Renderizar las tareas actualizadas
  rendersTareas.renderizarTareas(campoTareas, tareasRenderizadasActuales, true,mensaje);
}

function ordenarMayorMenor(tareas) {
  //Utilizo sort para ordenar de mayor a menor con respecto a la prioridad, pero uso slice para crear una
  //copia del arreglo original para no modificarlo porque necesito las tareas pendientes tal cual estan y asi solo
  //modifico la copia que es el arreglo ordenado de mayor a menor por prioridad
  const tareasPendientesPrioridadMayor = tareas.slice().sort((a, b) => {
    // Si la primer priroridad es null o undefined, mover al final
    if (a.prioridad === null || a.prioridad === undefined) return 1;
    // Si la segunda prioridad es null o undefined, mover al final
    if (b.prioridad === null || b.prioridad === undefined) return -1;

    return b.prioridad - a.prioridad;
  });

  return tareasPendientesPrioridadMayor;
}

function ordenarMenorMayor(tareas) {
  const tareasOrdenadasMenorMayor = tareas.slice().sort((a, b) => {
    // Si la primer priroridad es null o undefined, mover al final
    if (a.prioridad === null || a.prioridad === undefined) return 1;
    // Si la segunda prioridad es null o undefined, mover al final
    if (b.prioridad === null || b.prioridad === undefined) return -1;

    return a.prioridad - b.prioridad;
  });

  return tareasOrdenadasMenorMayor;
}

function ordenarParaHoy(tareas) {
  const fechaActual = new Date();
  tareasRenderizarParaHoy = [];
  console.log("TAREAS", tareas);
  tareas.forEach((tarea) => {
    const fechaDeTarea = tarea.fechaProgramada;

    // Verificar si la fechaProgramada es null o undefined
    if (!fechaDeTarea) {
      console.log("La tarea no tiene fecha programada:", tarea);
      return; // Saltar esta tarea
    }

    const fechaSeparadaDeHora = fechaDeTarea.split(","); // Para separar de la hora
    const fechaSeparada = fechaSeparadaDeHora[0].split("/"); // Dividir fecha por "/"

    const fechaDate = new Date(
      fechaSeparada[2], // Año
      fechaSeparada[0] - 1, // Mes (base 0)
      fechaSeparada[1] // Día
    );

    // Comparar usando `toDateString()` en `fechaDate`
    const fechaSistema = new Date(); // Fecha del sistema
    if (fechaSistema.toDateString() === fechaDate.toDateString()) {
      if (
        !tareasRenderizarParaHoy.some(
          (tareaI) => tareaI.idTarea === tarea.idTarea
        )
      ) {
        tareasRenderizarParaHoy.push(tarea);
        console.log("Arreglo", tareasRenderizarParaHoy);
      }
    } else {
      console.log("Las fechas son diferentes");
    }
  });

  if (tareasRenderizarParaHoy.length > 0) {
    //Se manda a renderizar las tareas del dia actual
  //  rendersTareas.renderizarTareas(campoTareas, tareasRenderizarParaHoy, true);
   // filtroParaHoy = true;
  }
  return tareasRenderizarParaHoy;
}

//Ordena las tareas por fecha programada desde la mas proxima hasta la menos proxima
function ordenarMasProximas(tareas){
console.log("tareas BASE",tareas);



  tareas.sort((a, b) => {
    console.log("fecha 1", convertirFecha(a.fechaProgramada));
    console.log("fecha 2", convertirFecha(b.fechaProgramada));
    return a.fechaProgramada == null ? 1 :         // Si 'a.fechaProgramada' es null, mueve 'a' al final
           b.fechaProgramada ==null ? -1 :        // Si 'b.fechaProgramada' es null, mueve 'b' al final
            convertirFecha(a.fechaProgramada) - convertirFecha(b.fechaProgramada); // Ordena por fecha
  });
  console.log("FECHAS ACOMODADAS POR MAS PROXIMAS", tareas);
  return tareas;
 
  }
  



//Metodo que convierte una fecha del formato MM/DD/YYYY, HH:MM:SS AM/PM a un objeto date para usar operadores
//logicos en las fechas
function convertirFecha(fechaString) {
  console.log("fecha", fechaString);
  if (!fechaString) return null; // Si la fecha es null o undefined, devuelve null

  // Si la fecha ya está en formato ISO, devolver un objeto Date directamente
  if (fechaString.includes("T")) {
    return new Date(fechaString);
  }

  // Si la fecha está en formato normal  MM/DD/YYYY, HH:MM:SS AM/PM, convertirla a formato ISO
  try {
    const [datePart, timePart] = fechaString.split(", ");
    const [month, day, year] = datePart.split("/");
    const [time, modifier] = timePart.split(" ");
    let [hours, minutes, seconds] = time.split(":");

    // Convertir horas a formato 24 horas
    if (modifier === "PM" && hours !== "12") {
      hours = parseInt(hours, 10) + 12;
    }
    if (modifier === "AM" && hours === "12") {
      hours = "00";
    }


    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds || "00").padStart(2, "0"); // Si no hay segundos agrego "00"

    // Crear la fecha en formato ISO (YYYY-MM-DDTHH:MM:SS)
    const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hours}:${minutes}:${seconds}`;
    console.log("fechaISO", fechaISO); // Para depuración

    // Devolver un objeto Date
    return new Date(fechaISO);
  } catch (error) {
    console.error("Error al convertir la fecha:", error);
    return null; // Si hay un error se devuelve null
  }
}
//Deselecciona una opcion ya seleccionada de las 2 opciones de filtro de prioridad y vuelve a cargar y renderizar
// las tareas dependiendo si esta seleccionado las pendientes o las completadas para mostrarlas sin el filtro
function deseleccionarPrioridad() {
  document
    .querySelectorAll('.contenedorFiltroPrioridad input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        // Si ya está seleccionado y es el mismo que el anterior
        if (this === radioPrioridadFiltro) {
          //actualizo las listas para establecer las tareas actuales segun la opcion seleccionada es decir
          //si es pendientes o completadas
       
          //Renderizo ya con las tareas actuales actualizadas y asi mostrar las tareas ya sea pendientes o completadas pero
          //sin filtro, asi como se agregaron a la base de datos
          // rendersTareas.renderizarTareas(
          //   campoTareas,
          //   tareasRenderizadasActuales,
          //   true
          // );
          //Quita el css del radio para que se vea deseleccion
          this.closest('.radio').classList.remove('selected');
          this.checked = false; // Deseleccionar
          radioPrioridadFiltro = null; // Reiniciar selección
          actualizarListas();
        //  tareasConFiltroPrioridadActuales.length = 0;
        } else {
          radioPrioridadFiltro = this; // Actualizar el radio seleccionado
        }
      });
    });
  //Vacio el arreglo donde se guardan las tareas con filtro de prioridad aplicado
  if (tareasConFiltroPrioridadActuales) {
    tareasConFiltroPrioridadActuales.length = 0;
  }
  // contenedorFiltros.classList.remove("prioridadMenorFiltro");
  // contenedorFiltros.classList.remove("prioridadMayorFiltro");
}
/*
//Deselecciona una opcion ya seleccionada de las 2 opciones de filtro de prioridad y vuelve a cargar y renderizar
// las tareas dependiendo si esta seleccionado las pendientes o las completadas para mostrarlas sin el filtro
function deseleccionarTareasParaHoy() {
  document
    .querySelectorAll('.contenedorFiltroProgramadas input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        // Si ya está seleccionado y es el mismo que el anterior
        if (this === radioParaHoyFiltro) {
          actualizarListas();

          rendersTareas.renderizarTareas(
            campoTareas,
            tareasRenderizadasActuales,
            true
          );

           this.checked = false;
        
          radioParaHoyFiltro = null; // Reiniciar selección

        } else {
          radioParaHoyFiltro = this; // Actualizar el radio seleccionado
        }
      });
    });
  //Vacio el arreglo donde se guardan las tareas con filtro de prioridad aplicado

}
*/

function deseleccionarTareasParaHoy() {
  document
    .querySelectorAll('.contenedorFiltroProgramadas input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        // Si ya está seleccionado y es el mismo que el anterior
        if (this === radioProgramadasFiltro) {
          console.log("Filtro para hoy");
          //Quita el css del radio para que se vea deseleccion
          this.closest('.radio').classList.remove('selected');
          this.checked = false;
          tareasParaHoyFiltroButton.checked=false;
          radioProgramadasFiltro = null; // Reiniciar selección

          //Actualizar la lista de tareas para que se muestren segun los filtros que quedan puestos
          actualizarListas();
         
        } else {
          radioProgramadasFiltro = this; // Actualizar el radio seleccionado
        }
      });
    });
}
document.addEventListener("DOMContentLoaded", async function () {
  campoTareas = document.querySelector("#listaTareas");

  //FILTROS
  contenedorFiltros = document.querySelector(".filtros");

  tareasPendientesButton = document.querySelector("#tareasPendientesFiltro");
  tareasCompletadasButton = document.querySelector("#tareasCompletadasFiltro");
  prioridadMayorButton = document.querySelector("#prioridadMayorFiltro");
  prioridadMenorButton = document.querySelector("#prioridadMenorFiltro");
  tareasParaHoyFiltroButton = document.querySelector("#tareasParaHoyFiltro");
  filtroProgramadasLabel = document.querySelector("#programadas");
  tareasProximasButton = document.querySelector("#tareasProximasFiltro");
  contenedorFiltroProgramadas = document.querySelector(
    ".contenedorFiltroProgramadas"
  );

  //Actualizo las tareas pendientes y completadas para cargarlas antes de usarlas
  await actualizarListaTareas();
  //LLamo al metodo para que deseleccione si se dio click al radio ya seleccionado
  deseleccionarPrioridad();
  deseleccionarTareasParaHoy();

  function cargarModoBase() {
    tareasPendientesButton.checked = true;
    tareasPendientesButton.closest('.radio').classList.add('selected');
    tareasRenderizadasActuales = [...tareasPendientes];
  }
  cargarModoBase();

  tareasCompletadasButton.addEventListener("click", function () {
    // if (!estadoCompletadasButton) {
    //   estadoCompletadasButton = true;
    //   estadoPendientesButton = false;
      //Le agrego la clase filtro al contenedor de los filtros para indicar que se aplico un filtro
     // contenedorFiltros.classList.add("filtro");
      // contenedorFiltros.classList.remove("prioridadMenorFiltro");
      // contenedorFiltros.classList.remove("prioridadMayorFiltro");

      //PARA OCULTAR EL FILTRO DE FECHA CON LAS TAREAS COMPLETADAS
      // contenedorFiltroProgramadas.disabled = true;
      // contenedorFiltroProgramadas.style.opacity = "0.5";
      // contenedorFiltroProgramadas.style.pointerEvents = "none";

      //Pongo null el input tipo radio del filtro para hoy para actualizar la lista de tareas y solo tome la de completadas
      //que es el que se esta clickeando
      // radioParaHoyFiltro=null;
      // //Deselecciono el filtro
      // tareasParaHoyFiltroButton.checked = false;
     
      actualizarListas();

      // if (prioridadMayorButton.checked || prioridadMenorButton.checked) {
      //   tareasRenderizadasActuales = [...tareasCompletadas];

      //   actualizarListas();

      //   return;
      // }

      // rendersTareas.renderizarTareas(campoTareas, tareasCompletadas, true);
      // tareasRenderizadasActuales = [...tareasCompletadas];
    // }
  });

  tareasPendientesButton.addEventListener("click", function () {
    // if (!estadoPendientesButton) {
    //   estadoCompletadasButton = false;
    //   estadoPendientesButton = true;
      //Le agrego la clase filtro al contenedor de los filtros para indicar que se aplico un filtro
     // contenedorFiltros.classList.add("filtro");
      // contenedorFiltros.classList.remove("prioridadMenorFiltro");
      // contenedorFiltros.classList.remove("prioridadMayorFiltro");

      // //Vuelvo a habilitar el elemento donde estan los inputs radio para los filtros de las tareas prgroamadas "Para hoy" y "Vencidas"
      // if (contenedorFiltroProgramadas.disabled == true) {
      //   contenedorFiltroProgramadas.disabled = false;
      //   contenedorFiltroProgramadas.style.opacity = "1";
      //   contenedorFiltroProgramadas.style.pointerEvents = "auto";
      // }

      // if (prioridadMayorButton.checked || prioridadMenorButton.checked) {
      //   tareasRenderizadasActuales = [...tareasPendientes];
        actualizarListas();
      //   return;
      // }

      // rendersTareas.renderizarTareas(campoTareas, tareasPendientes, true);
      // tareasRenderizadasActuales = [...tareasPendientes];
    // }
  });

  prioridadMayorButton.addEventListener("click", function () {
    actualizarListas();
  });

  prioridadMenorButton.addEventListener("click", function () {
    actualizarListas();
  });

  tareasParaHoyFiltroButton.addEventListener("click", function () {
    // if (this.checked) {
    //   actualizarListas();
    // } else {
    //   // Si se deselecciona el filtro "para hoy", aplicar el filtro de prioridad activo
    //   if (prioridadMayorButton.checked || prioridadMenorButton.checked) {
        // prioridadMayor();
        actualizarListas();
    //   }
    // }
  });

  tareasProximasButton.addEventListener("click",function(){
    actualizarListas();
  });

  // //Remueve o agrega la clase selected si cambia el estado del radio para que se aplique
  // //el css de la clase selected que es para que cambia el fondo de color al hacer click en el radio
  document.querySelectorAll('input[type="radio"].opcionFiltro').forEach((radio) => {
    radio.addEventListener('change', function () {
      // Obtiene el nombre del grupo al que pertenece el radio seleccionado
      const groupName = this.name;
  
      // Remueve la clase 'selected' de todos los radios del mismo grupo
      document.querySelectorAll(`input[name="${groupName}"]`).forEach((radioInGroup) => {
        radioInGroup.closest('.radio').classList.remove('selected');
      });
  
      // Agrega la clase 'selected' al contenedor del radio seleccionado
      if (this.checked) {
        this.closest('.radio').classList.add('selected');
      }
    });
  });

  // //Observer para ver cuando se modifica el componente listaTareas y asi si esta aplicado un filtro
  // //aplicarlo con la nueva tarea agregada y no en su forma base.
  // const observer = new MutationObserver((mutationsList) => {
  //   mutationsList.forEach((mutation) => {
  //     // Comprueba si se modificaron atributos es decir si se actualizo en nodo
  //     if (mutation.type === "attributes") {
  //       console.log("entro al mutation");
  //       observer.disconnect();
  //       tareasRenderizadasActuales = [...tareasPendientes];
  //       if (contenedorFiltros.classList.contains("prioridadMayorFiltro")) {
  //         const tareasOrdenadasPrioridadMayor = ordenarMayorMenor(
  //           tareasRenderizadasActuales
  //         );
  //         rendersTareas.renderizarTareas(
  //           campoTareas,
  //           tareasOrdenadasPrioridadMayor,
  //           true
  //         );
  //       } else if (
  //         contenedorFiltros.classList.contains("prioridadMenorFiltro")
  //       ) {
  //         const tareasOrdenadasPrioridadMenor = ordenarMenorMayor(
  //           tareasRenderizadasActuales
  //         );
  //         rendersTareas.renderizarTareas(
  //           campoTareas,
  //           tareasOrdenadasPrioridadMenor,
  //           true
  //         );
  //       }

  //       observer.observe(campoTareas, config);
  //     }
  //   });
  // });

  // // Configurar qué tipo de cambios observar
  // const config = {
  //   childList: false, // Detectar cambios en los nodos hijos
  //   subtree: true, // incluir cambios en los hijos de los nodos hijos
  //   attributes: true, //Para detectar cambios en los atributos
  // };

  // // Empezar a observar el campoTareas
  // observer.observe(campoTareas, config);

});
