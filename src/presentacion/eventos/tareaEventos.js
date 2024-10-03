import { etiquetasSeleccionadas, componentesEtiquetas } from "../componentes/etiquetaRender.js";
import { agregarTarea } from "../servicios/tareas.js"; 

document.addEventListener("DOMContentLoaded", function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const btnAgregarTarea = document.querySelector(".agregarModal");
  const listaEtiquetas = document.querySelector("#listaEtiquetas");
  const formTarea=document.querySelector("form");
  const btnCancelarModal=document.querySelector(".cancelarModal")
  const modal = document.querySelector('#miModal');

 

  formTarea.addEventListener('submit', async function(e) {
    e.preventDefault(); // Para que no se recargue la pagina
    
    
    if (!tituloTarea.value.trim()) {
        alert('El título es obligatorio');
        return; // Si no hay titulo, termina la ejecucion del submit
    }

    await manejarAgregarTarea();
    
});

btnCancelarModal.addEventListener('click',function(){
limpiarCampos();
modal.style.display = 'none';

})

  async function manejarAgregarTarea() {
   
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    //Se obtiene el valor solo si se selecciono una opcion, si no, entonces null, la prioridad es opcional
    const valorPrioridad=prioridad?prioridad.value:null;

    const tareaNueva = {
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaCreacion: new Date().toISOString().slice(0, 19).replace("T", " "),
      fechaUltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " "),
      completada: false,
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: valorPrioridad,
      etiquetas: etiquetasSeleccionadas,
    };

    try {
      const data = await agregarTarea(tareaNueva); 
      console.log(data);
     
      limpiarCampos();

      alert("Se ha guardado correctamente la tarea");
    } catch (error) {
      console.log(error);
      alert(error.message); 
    }
  }

  function limpiarCampos(){
    const prioridad = document.querySelector('input[name="prioridad"]:checked');
    tituloTarea.value = "";
      descripcionTarea.value = "";
      if(prioridad){
      prioridad.checked = false;
      }
      listaEtiquetas.innerHTML = "";
      etiquetasSeleccionadas.length = 0;
    
  }
});
