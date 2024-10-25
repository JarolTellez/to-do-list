import {tareasPendientes, tareasCompletadas,} from "../eventos/tareaEventos.js";
import { rendersTareas } from "../componentes/tareaRender.js";



document.addEventListener("DOMContentLoaded", async function () {

    const campoTareas = document.querySelector("#listaTareas");

     //FILTROS
  const contenedorFiltros=document.querySelector(".filtros");
  const tareasPendientesButton=document.querySelector("#tareasPendientesFiltro");
  const tareasCompletadasButton=document.querySelector("#tareasCompletadasFiltro");
  const prioridadMayorButton=document.querySelector("#prioridadMayorFiltro");
  const prioridadMenorButton=document.querySelector("#prioridadMayorFiltro");


  tareasCompletadasButton.addEventListener("click",function(){
    console.log("ja")
   // filtroSeleccionado=true;
    contenedorFiltros.classList.add("filtro")
    rendersTareas.renderizarTareas(campoTareas,tareasCompletadas,true);

});

tareasPendientesButton.addEventListener("click",function(){
//  filtroSeleccionado=true;
contenedorFiltros.classList.add("filtro")
  rendersTareas.renderizarTareas(campoTareas,tareasPendientes,true);

});
});