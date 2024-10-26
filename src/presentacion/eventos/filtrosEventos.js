import {
  tareasPendientes,
  tareasCompletadas,
  actualizarListaTareas} from "../eventos/tareaEventos.js";
import { rendersTareas } from "../componentes/tareaRender.js";

//Para guardar el boton para filtrar por tareas pendientes para poder usarla en la funcion
//que exporto abajo "botonPendientesChecked" ;e establezco el valor en el "DOMContentLoaded" 
let tareasPendientesButton;

export  function botonPendientesChecked(seleccionado){
  tareasPendientesButton.checked=seleccionado && seleccionado==true?true:false;
}

document.addEventListener("DOMContentLoaded", async function () {
  const campoTareas = document.querySelector("#listaTareas");

  //FILTROS
  const contenedorFiltros = document.querySelector(".filtros");
 
 tareasPendientesButton = document.querySelector(
    "#tareasPendientesFiltro"
  );
  const tareasCompletadasButton = document.querySelector(
    "#tareasCompletadasFiltro"
  );
  const prioridadMayorButton = document.querySelector("#prioridadMayorFiltro");
  const prioridadMenorButton = document.querySelector("#prioridadMenorFiltro");

  let radioPrioridadFiltro=null;
  let tareasRenderizadasActuales;
  let estadoPendientesButton=false;
  let estadoCompletadasButton=false;

  //Actualizo las tareas pendientes y completadas para cargarlas antes de usarlas
  await actualizarListaTareas();
   //LLamo al metodo para que deseleccione si se dio click al radio ya seleccionado
   deseleccionarPrioridad();

   function cargarModoBase(){
    tareasPendientesButton.checked=true;
    tareasRenderizadasActuales=[...tareasPendientes];
   
   }
   cargarModoBase();

   function actualizarListas(){
      tareasRenderizadasActuales=tareasPendientesButton.checked?[...tareasPendientes]:[...tareasCompletadas];
  
   }

  

  tareasCompletadasButton.addEventListener("click", function () {
    estadoCompletadasButton=true;
    //Le agrego la clase filtro al contenedor de los filtros para indicar que se aplico un filtro
    contenedorFiltros.classList.add("filtro");
    // contenedorFiltros.classList.remove("prioridadMenorFiltro");
    // contenedorFiltros.classList.remove("prioridadMayorFiltro");

    if(prioridadMayorButton.checked){
      tareasRenderizadasActuales=[...tareasCompletadas];
      prioridadMayor();
     
      return;
    }else if(prioridadMenorButton.checked){
      tareasRenderizadasActuales=[...tareasCompletadas];
      prioridadMenor();
      
      return;
    }
    rendersTareas.renderizarTareas(campoTareas, tareasCompletadas, true);
    tareasRenderizadasActuales=[...tareasCompletadas];
  });

  tareasPendientesButton.addEventListener("click", function () {
    estadoCompletadasButton=false;
    estadoPendientesButton=!estadoPendientesButton;
    //Le agrego la clase filtro al contenedor de los filtros para indicar que se aplico un filtro
    contenedorFiltros.classList.add("filtro");
    // contenedorFiltros.classList.remove("prioridadMenorFiltro");
    // contenedorFiltros.classList.remove("prioridadMayorFiltro");
    if(prioridadMayorButton.checked){
      tareasRenderizadasActuales=[...tareasPendientes];
      prioridadMayor();   
      return;
    }else if(prioridadMenorButton.checked){
      tareasRenderizadasActuales=[...tareasPendientes];
      prioridadMenor();
      
      return;
    }
    rendersTareas.renderizarTareas(campoTareas, tareasPendientes, true);
    tareasRenderizadasActuales=[...tareasPendientes];
  });


 

  prioridadMayorButton.addEventListener("click", function () {
    
    prioridadMayor();
  });

  function prioridadMayor(){
    
    //Verifico que el radio si este seleccionado
    if(prioridadMayorButton.checked){
     actualizarListas();
      contenedorFiltros.classList.add("filtro","prioridadMayorFiltro");
      contenedorFiltros.classList.remove("prioridadMenorFiltro");
      const tareasOrdenadasPrioridadMayor = ordenarMayorMenor(tareasRenderizadasActuales);
      rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMayor, true);
      }
  }

  prioridadMenorButton.addEventListener("click", function () {
    
  prioridadMenor();
  });

  function prioridadMenor(){
     //Verifico que el radio si este seleccionado
    if(prioridadMenorButton.checked){
      actualizarListas();
      contenedorFiltros.classList.remove("prioridadMayorFiltro");
      contenedorFiltros.classList.add("filtro","prioridadMenorFiltro");
      const tareasOrdenadasPrioridadMenor = ordenarMenorMayor(tareasRenderizadasActuales);
      rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMenor,true);
      }
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

  function deseleccionarPrioridad() {
    document
      .querySelectorAll('.contenedorFiltroPrioridad input[type="radio"]')
      .forEach((radio) => {
        radio.addEventListener("click", function () {
          // Si ya está seleccionado y es el mismo que el anterior
          if (this === radioPrioridadFiltro) {
            this.checked = false; // Deseleccionar
            radioPrioridadFiltro = null; // Reiniciar selección
          } else {
            radioPrioridadFiltro = this; // Actualizar el radio seleccionado
          }
        });
      });
      contenedorFiltros.classList.remove("prioridadMenorFiltro");
      contenedorFiltros.classList.remove("prioridadMayorFiltro");
  }


//Observer para ver cuando se modifica el componente listaTareas y asi si esta aplicado un filtro
//aplicarlo con la nueva tarea agregada y no en su forma base.
const observer = new MutationObserver((mutationsList) => {
  mutationsList.forEach(mutation => {
     // Comprueba si se modificaron atributos es decir si se actualizo en nodo
    if (mutation.type === 'attributes') {
      console.log("entro al mutation")
      observer.disconnect();
      tareasRenderizadasActuales=[...tareasPendientes];
     if(contenedorFiltros.classList.contains("prioridadMayorFiltro")){
      const tareasOrdenadasPrioridadMayor = ordenarMayorMenor(tareasRenderizadasActuales);
      rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMayor, true);
     }else if(contenedorFiltros.classList.contains("prioridadMenorFiltro")){
      const tareasOrdenadasPrioridadMenor = ordenarMenorMayor(tareasRenderizadasActuales);
     rendersTareas.renderizarTareas(campoTareas,tareasOrdenadasPrioridadMenor, true);
      } 

     observer.observe(campoTareas, config);
    
    }
  });
});

// Configurar qué tipo de cambios observar
const config = {
  childList: false,  // Detectar cambios en los nodos hijos
  subtree: true,   // incluir cambios en los hijos de los nodos hijos
  attributes :true //Para detectar cambios en los atributos
};

// Empezar a observar el campoTareas
observer.observe(campoTareas, config);
});

