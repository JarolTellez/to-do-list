import {
  tareasPendientes,
  tareasCompletadas,
  actualizarListaTareas,
} from "../eventos/tareaEventos.js";
import { rendersTareas } from "../componentes/tareaRender.js";
import { rendersMensajes } from "../componentes/mensajesRender.js";
import { FiltradoOrdenamiento } from "../../../src/filtradoOrdenamiento.js";
import { TareaPendienteEspecificacion } from "../../../src/filtros/tareaPendienteEspecificacion.js";
import { TareaCompletadaEspecificacion } from "../../../src/filtros/tareaCompletadaEspecificacion.js";
import { TareaParaHoyEspecificacion } from "../../../src/filtros/tareaParaHoyEspecificacion.js";
import { OrdenarPorFechaAsc } from "../../../src/ordenamiento/ordenarPorFechaAsc.js";
import { OrdenarPorFechaDesc } from "../../../src/ordenamiento/ordenarPorFechaDesc.js";
import { OrdenarPorPrioridadAsc } from "../../../src/ordenamiento/ordenarPorPrioridadAsc.js";
import { OrdenarPorPrioridadDesc } from "../../../src/ordenamiento/ordenarPorPrioridadDesc.js";

// import e from "cors";

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
let radioProgramadasFiltro = null;
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

const ordenador = new FiltradoOrdenamiento();

// Metodo que se llama desde tareaEventos cuando se agrega una tarea para mostrar las tareas pendientes
// y quitar el filtro para hoy y el de completadas si estan seleccionado
export function botonPendientesChecked(seleccionado) {
  tareasPendientesButton.checked =
    seleccionado && seleccionado == true ? true : false;
  tareasPendientesButton.checked = true;
  tareasPendientesButton.closest(".radio").classList.add("selected");
  tareasCompletadasButton.checked = false;
  tareasCompletadasButton.closest(".radio").classList.remove("selected");

  //Quitar el checked del button radio del filtro "Para hoy" despues de agregar una tarea para cuando se llame
  //a  actualizarListas() no aplique el filtro para hoy solo si la fechaProgramada de la tarea recien agregada
  //no es para el dia actual, en dado caso que si lo sea, se deja el filtro para que se aplique y se muestre la tarea
  //recien agregada pero con el filtro aplicado
  const tareasHoy = ordenarParaHoy(
    tareasPendientes[tareasPendientes.length - 1]
  );
  if (tareasPendientesButton.checked && tareasHoy.length <= 0) {
    if (radioProgramadasFiltro) {
      tareasParaHoyFiltroButton.checked = false;
      tareasParaHoyFiltroButton.closest(".radio").classList.remove("selected");
      //Reinicio la seleccion del filtro paraHoy el que se usa en el  AddEventListener tipo click

      radioProgramadasFiltro = null;
    }
  }

  actualizarListas();

  // if (prioridadMayorButton.checked || prioridadMayorButton.checked) {
  // prioridadMayor();

  // }
}

//ORIGINAL
// export function actualizarListas() {
//   console.log("ENTRO A ACTUALIZARLISTAS");
//   //Mensaje que aparece en donde se muestran las tareas
//   let mensaje = null;
//   //Mensaje que aparecera en el toast
//   let mensajeFlotante="No hay tareas para aplicar filtros";

//   // Inicializar con las tareas pendientes o completadas según el filtro seleccionado
//   if (tareasCompletadasButton.checked) {
//     console.log("COMPLETADAS");
//     tareasRenderizadasActuales = [...tareasCompletadas];
//     if (tareasCompletadas.length <= 0) {
//       mensaje = "No hay tareas completadas";
//       desactivarFiltros(); // Desactiva los filtros si no hay tareas completadas
//       desactivarFiltrosDePrioridad()
//     }
//   } else if (tareasPendientesButton.checked) {
//     console.log("PENDIENTES");
//     tareasRenderizadasActuales = [...tareasPendientes];
//     if (tareasPendientes.length <= 0) {
//       console.log("mPENDIENTES 2");
//       mensaje = "No hay tareas pendientes";
//       desactivarFiltros(); // Desactiva los filtros si no hay tareas pendientes
//       desactivarFiltrosDePrioridad()

//       rendersMensajes.mostrarToast(mensajeFlotante,true);
//     }
//   }

//   console.log("TAREAS ANTES DE APLICAR FILTROS", tareasRenderizadasActuales);

//   // Aplicar filtros solo si hay tareas en la lista actual
//   if (tareasRenderizadasActuales.length > 0) {
//     // Aplicar filtro "para hoy" si está seleccionado
//     if (tareasParaHoyFiltroButton.checked) {
//       console.log("FILTRO PARA HOY");
//       const tareasFiltradas = ordenarParaHoy(tareasRenderizadasActuales);
//       if (tareasFiltradas.length > 0) {
//         tareasRenderizadasActuales = tareasFiltradas;
//       } else {
//         tareasRenderizadasActuales = []; // Vacia la lista si no hay tareas para hoy
//         mensaje = "No hay tareas para hoy";
//         desactivarFiltrosDePrioridad(); // Desactiva los filtros de prioridad
//       }
//     }

//     // Aplicar filtros de prioridad solo si hay tareas
//     if (tareasRenderizadasActuales.length > 0) {
//       if (prioridadMayorButton.checked&&radioPrioridadFiltro) {
//         console.log("FILTRO MAYOR");
//         tareasRenderizadasActuales = ordenarMayorMenor(tareasRenderizadasActuales);
//       } else if (prioridadMenorButton.checked&&radioPrioridadFiltro) {
//         console.log("FILTRO MENOR");
//         tareasRenderizadasActuales = ordenarMenorMayor(tareasRenderizadasActuales);
//       }
//     }else  {
//   console.log("entra");
//       rendersMensajes.mostrarToast(mensajeFlotante,false);
//     }

//     // Aplicar filtro "próximas" si está seleccionado
//     if (tareasProximasButton.checked) {
//       console.log("FILTRO PRÓXIMAS");
//       const tareasFiltradas = ordenarMasProximas(tareasRenderizadasActuales);
//       if (tareasFiltradas.length > 0) {
//         tareasRenderizadasActuales = tareasFiltradas;
//       } else {
//         tareasRenderizadasActuales = []; // Vaciar la lista si no hay tareas próximas
//         mensaje = "No hay tareas próximas";
//       }
//     }
//   } else {
//     // Si no hay tareas en la lista seleccionada, desactivar los filtros
//     desactivarFiltros();

//   }

//   console.log("TAREAS DESPUES DE APLICAR FILTROS", tareasRenderizadasActuales);

//   // Renderizar las tareas actualizadas (incluso si la lista está vacía)
//   rendersTareas.renderizarTareas(campoTareas, tareasRenderizadasActuales, true, mensaje);
// }

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

  tareasRenderizadasActuales = ordenador.ordenar(tareasAProcesar);

  if (tareasRenderizadasActuales.length === 0 && filtroAdicional) {
    mensaje = tareasParaHoyFiltroButton.checked
      ? "No hay tareas para hoy"
      : "No hay tareas próximas";
  }

  rendersTareas.renderizarTareas(
    campoTareas,
    tareasRenderizadasActuales,
    true,
    mensaje
  );
}

function desactivarFiltros() {
  // Desactiva todos los filtros (checked = false)
  prioridadMayorButton.checked = false;
  prioridadMenorButton.checked = false;
  tareasParaHoyFiltroButton.checked = false;
  tareasProximasButton.checked = false;

  // Remueve la clase 'selected' de los botones de filtro
  prioridadMayorButton.closest(".radio").classList.remove("selected");
  prioridadMenorButton.closest(".radio").classList.remove("selected");
  tareasParaHoyFiltroButton.closest(".radio").classList.remove("selected");
  tareasProximasButton.closest(".radio").classList.remove("selected");
}

function desactivarFiltrosDePrioridad() {
  // Desactiva solo los filtros de prioridad (mayor y menor)
  prioridadMayorButton.checked = false;
  prioridadMenorButton.checked = false;

  // Remueve la clase 'selected' de los botones de prioridad
  prioridadMayorButton.closest(".radio").classList.remove("selected");
  prioridadMenorButton.closest(".radio").classList.remove("selected");
}

//Deselecciona una opcion ya seleccionada de las 2 opciones de filtro de prioridad y vuelve a cargar y renderizar
// las tareas dependiendo si esta seleccionado las pendientes o las completadas para mostrarlas sin el filtro
function deseleccionarPrioridad() {
  document
    .querySelectorAll('.contenedorFiltroPrioridad input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        // Si ya está seleccionado y es el mismo que el anterior
        console.log("tamano", tareasRenderizadasActuales.length);
        if (this === radioPrioridadFiltro) {
          console.log("Deseleccion PRIORIDAD");
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

          this.closest(".radio").classList.remove("selected");
          this.checked = false; // Deseleccionar
          radioPrioridadFiltro = null; // Reiniciar selección
          actualizarListas();

          //  tareasConFiltroPrioridadActuales.length = 0;

          //Verifica que haya tareas a renderizar para aplicar el filtro de prioridad como seleccionado
          //si no hay tareas a renderizar aunque se haga click en el boton no se va a marcar como seleccionado
        } else if (tareasRenderizadasActuales.length > 0) {
          console.log("Deseleccion asignada");
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

function deseleccionarTareasParaHoy() {
  document
    .querySelectorAll('.contenedorFiltroProgramadas input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("click", function () {
        // Si ya está seleccionado y es el mismo que el anterior
        if (this === radioProgramadasFiltro) {
          console.log("Filtro para hoy deseleccion");
          //Quita el css del radio para que se vea deseleccion
          this.closest(".radio").classList.remove("selected");
          this.checked = false;
          tareasParaHoyFiltroButton.checked = false;
          // prioridadMayorButton.checked=false;
          // prioridadMenorButton.checked=false;
          radioProgramadasFiltro = null; // Reiniciar selección

          //Actualizar la lista de tareas para que se muestren segun los filtros que quedan puestos
          actualizarListas();
        } else {
          console.log("Seleccion en filtro hoy");
          radioProgramadasFiltro = this; // Actualizar el radio seleccionado
        }
      });
    });
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
  const tareasArreglo = Array.isArray(tareas) ? tareas : [tareas];
  tareasRenderizarParaHoy = [];
  console.log("TAREAS", tareas);
  tareasArreglo.forEach((tarea) => {
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
function ordenarMasProximas(tareas) {
  console.log("tareas BASE", tareas);

  tareas.sort((a, b) => {
    console.log("fecha 1", convertirFecha(a.fechaProgramada));
    console.log("fecha 2", convertirFecha(b.fechaProgramada));
    return a.fechaProgramada == null
      ? 1 // Si 'a.fechaProgramada' es null, mueve 'a' al final
      : b.fechaProgramada == null
      ? -1 // Si 'b.fechaProgramada' es null, mueve 'b' al final
      : convertirFecha(a.fechaProgramada) - convertirFecha(b.fechaProgramada); // Ordena por fecha
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
    const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}T${hours}:${minutes}:${seconds}`;
    console.log("fechaISO", fechaISO); // Para depuración

    // Devolver un objeto Date
    return new Date(fechaISO);
  } catch (error) {
    console.error("Error al convertir la fecha:", error);
    return null; // Si hay un error se devuelve null
  }
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
    tareasPendientesButton.closest(".radio").classList.add("selected");
    tareasRenderizadasActuales = [...tareasPendientes];
  }
  cargarModoBase();

  tareasCompletadasButton.addEventListener("click", function () {
    actualizarListas();
  });

  tareasPendientesButton.addEventListener("click", function () {
    actualizarListas();
  });

  prioridadMayorButton.addEventListener("click", function () {
    actualizarListas();
  });

  prioridadMenorButton.addEventListener("click", function () {
    actualizarListas();
  });

  tareasParaHoyFiltroButton.addEventListener("click", function () {
    actualizarListas();
  });

  tareasProximasButton.addEventListener("click", function () {
    actualizarListas();
  });

  // //Remueve o agrega la clase selected si cambia el estado del radio para que se aplique
  // //el css de la clase selected que es para que cambia el fondo de color al hacer click en el radio
  document
    .querySelectorAll('input[type="radio"].opcionFiltro')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        // Obtiene el nombre del grupo al que pertenece el radio seleccionado
        const groupName = this.name;

        // Remueve la clase 'selected' de todos los radios del mismo grupo
        document
          .querySelectorAll(`input[name="${groupName}"]`)
          .forEach((radioInGroup) => {
            radioInGroup.closest(".radio").classList.remove("selected");
          });

        // Agrega la clase 'selected' al contenedor del radio seleccionado, agrega la clase al radio si
        // hay tareas a renderizar, si el radio checked es el de pendientes o el de tareas para hoy ya que esos
        // aunque no haya tarea deben aparecer seleccionados a diferencia del de prioridad mayor y menor que no se
        //debe permtiir mostrarlos clickeados ya que no hay tareas a las cuales aplicarle los filtros
        if (this.checked) {
          if (
            tareasRenderizadasActuales.length > 0 ||
            this.value == "Pendientes" ||
            this.value == "hoy"
          ) {
            this.closest(".radio").classList.add("selected");
          }
        }
      });
    });
});
