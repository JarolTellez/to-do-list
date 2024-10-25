import {
  tareasPendientes,
  tareasCompletadas,
} from "../eventos/tareaEventos.js";
import { rendersTareas } from "../componentes/tareaRender.js";

document.addEventListener("DOMContentLoaded", async function () {
  const campoTareas = document.querySelector("#listaTareas");

  //FILTROS
  const contenedorFiltros = document.querySelector(".filtros");
  const tareasPendientesButton = document.querySelector(
    "#tareasPendientesFiltro"
  );
  const tareasCompletadasButton = document.querySelector(
    "#tareasCompletadasFiltro"
  );
  const prioridadMayorButton = document.querySelector("#prioridadMayorFiltro");
  const prioridadMenorButton = document.querySelector("#prioridadMenorFiltro");

  tareasCompletadasButton.addEventListener("click", function () {
    //Le agrego la clase filtro al contenedor de los filtros para indicar que se aplico un filtro
    contenedorFiltros.classList.add("filtro");
    contenedorFiltros.classList.remove("prioridadMenorFiltro");
    contenedorFiltros.classList.remove("prioridadMayorFiltro");

    rendersTareas.renderizarTareas(campoTareas, tareasCompletadas, true);
  });

  tareasPendientesButton.addEventListener("click", function () {
    //Le agrego la clase filtro al contenedor de los filtros para indicar que se aplico un filtro
    contenedorFiltros.classList.add("filtro");
    contenedorFiltros.classList.remove("prioridadMenorFiltro");
    contenedorFiltros.classList.remove("prioridadMayorFiltro");
    rendersTareas.renderizarTareas(campoTareas, tareasPendientes, true);
  });

  prioridadMayorButton.addEventListener("click", function () {
    contenedorFiltros.classList.add("filtro","prioridadMayorFiltro");
    contenedorFiltros.classList.remove("prioridadMenorFiltro");
    const tareasOrdenadasPrioridadMayor = ordenarMayorMenor(tareasPendientes);
    rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMayor, true);
  });

  prioridadMenorButton.addEventListener("click", function () {
    console.log("entro a menor");
    contenedorFiltros.classList.remove("prioridadMayorFiltro");
    contenedorFiltros.classList.add("filtro","prioridadMenorFiltro");
    const tareasOrdenadasPrioridadMenor = ordenarMenorMayor(tareasPendientes);
    rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMenor,true);
  });

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


//Observer para ver cuando se modifica el componente listaTareas y asi si esta aplicado un filtro
//aplicarlo con la nueva tarea agregada y no en su forma base.
const observer = new MutationObserver((mutationsList) => {
  mutationsList.forEach(mutation => {
    if (mutation.type === 'childList') {
      console.log('Se ha hecho un cambio en #listaTareas');
      observer.disconnect();
     if(contenedorFiltros.classList.contains("prioridadMayorFiltro")){
      const tareasOrdenadasPrioridadMayor = ordenarMayorMenor(tareasPendientes);
    rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMayor, true);
     }else if(contenedorFiltros.classList.contains("prioridadMenorFiltro")){
      console.log("entro a menor");
      const tareasOrdenadasPrioridadMenor = ordenarMenorMayor(tareasPendientes);
     rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMenor, true);
      } 

     observer.observe(campoTareas, config);
     
    }
  });
});

// Configurar qué tipo de cambios observar
const config = {
  childList: true,  // Detectar cambios en los nodos hijos
  subtree: false    // No incluir cambios en los hijos de los nodos hijos
};

// Empezar a observar el campoTareas
observer.observe(campoTareas, config);
});
