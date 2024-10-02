import { etiquetasSeleccionadas } from "../componentes/etiquetaRender.js";
import { agregarTarea } from "../servicios/tareas.js"; 

document.addEventListener("DOMContentLoaded", function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const btnAgregarTarea = document.querySelector(".agregarModal");
  const listaEtiquetas = document.getElementById("listaEtiquetas");

  btnAgregarTarea.addEventListener("click", async function () {
    await manejarAgregarTarea();
  });

  async function manejarAgregarTarea() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    const tareaNueva = {
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaCreacion: new Date().toISOString().slice(0, 19).replace("T", " "),
      fechaUltimaActualizacion: new Date().toISOString().slice(0, 19).replace("T", " "),
      completada: false,
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: prioridad.value,
      etiquetas: etiquetasSeleccionadas,
    };

    try {
      const data = await agregarTarea(tareaNueva); 
      console.log(data);
      
     
      tituloTarea.value = "";
      descripcionTarea.value = "";
      prioridad.checked = false;
      listaEtiquetas.innerHTML = "";
      etiquetasSeleccionadas.length = 0;

      alert("Se ha guardado correctamente la tarea");
    } catch (error) {
      alert(error.message); 
    }
  }
});
