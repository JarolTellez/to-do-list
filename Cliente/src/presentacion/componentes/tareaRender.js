import { componentesEtiquetas } from "../componentes/etiquetaRender.js";
import { formatearFechaRender } from "../../core/utils/formatearFecha.js";
//let timeoutId = null; 
export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas, limpiar,mensaje) {
    //PARA LIMPIAR
    if (limpiar && limpiar === true) {
      componenteTareas.innerHTML = "";
    }
    
    if(listaTareas.length<=0 && mensaje){
      componenteTareas.innerHTML = mensaje;
      return;
    }
    console.log("Renderizando", listaTareas);
    listaTareas.forEach((tareaElemento) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.id = `tareaDiv-${tareaElemento.idTarea}`;
      tareaDiv.innerHTML = `
      <div class="principalTarea" id="tarea-${tareaElemento.idTarea}">
         <div class="contenedorTarea" value="${tareaElemento.idTarea}">
          <h3 class="scrollTituloDescripcion">${tareaElemento.nombre}</h3>
           <p class="fechaActualizada"> 
         ${tareaElemento.fechaProgramada?`<span class='calendario'>📅</span>`+ formatearFechaRender(tareaElemento.fechaProgramada):""}</p>
           ${`<p class="scrollTituloDescripcion descripcionRender ${
             !tareaElemento.descripcion ? "hidden" : "" } textTarea">
     ${tareaElemento.descripcion || ""}
   </p>`}
         
            ${`<div class="prioridad-container ${
              !tareaElemento.prioridad ? "hidden" : ""
            }">
   <span class="prioridad-text">Prioridad</span>
   <div class="prioridad-barra" style="width: ${
     tareaElemento.prioridad ? tareaElemento.prioridad * 20 : ""
   }%; background: linear-gradient(to right, rgba(0, 128, 0, 0.3), rgba(0, 128, 0, 1));">
     <span class="prioridad-numero">${
       tareaElemento.prioridad ? tareaElemento.prioridad : ""
     }</span>
   </div>
 </div>`}
           ${
             tareaElemento.etiquetas && tareaElemento.etiquetas.length > 0
               ? `  
               <div class="etiquetas-container">
    <strong>Etiquetas:</strong>
    <div class="etiquetas scrollEtiqueta">
        <ul class="ulEtiquetas"></ul>
    </div>
   
          </div>`
               : `  <div class="etiquetas-container hidden">
    <strong>Etiquetas:</strong>
    <div class="etiquetas scrollEtiqueta">
        <ul class="ulEtiquetas"></ul>
    </div>
    
          </div>`
           }
           <div class="completado-container">
  <input type="checkbox" id="completado-${
    tareaElemento.idTarea
  }" class="checkbox-completado"  value="${tareaElemento.idTarea}" ${
        tareaElemento.completada > 0 ? "checked disabled" : ""
      }/>
  <label for="completado-${
    tareaElemento.idTarea
  }" class="checkbox-label"></label>
</div>

 <span class="btn-eliminar" data-id="${tareaElemento.idTarea}"> <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 48 48">
<path d="M 24 4 C 20.491685 4 17.570396 6.6214322 17.080078 10 L 10.238281 10 A 1.50015 1.50015 0 0 0 9.9804688 9.9785156 A 1.50015 1.50015 0 0 0 9.7578125 10 L 6.5 10 A 1.50015 1.50015 0 1 0 6.5 13 L 8.6386719 13 L 11.15625 39.029297 C 11.427329 41.835926 13.811782 44 16.630859 44 L 31.367188 44 C 34.186411 44 36.570826 41.836168 36.841797 39.029297 L 39.361328 13 L 41.5 13 A 1.50015 1.50015 0 1 0 41.5 10 L 38.244141 10 A 1.50015 1.50015 0 0 0 37.763672 10 L 30.919922 10 C 30.429604 6.6214322 27.508315 4 24 4 z M 24 7 C 25.879156 7 27.420767 8.2681608 27.861328 10 L 20.138672 10 C 20.579233 8.2681608 22.120844 7 24 7 z M 11.650391 13 L 36.347656 13 L 33.855469 38.740234 C 33.730439 40.035363 32.667963 41 31.367188 41 L 16.630859 41 C 15.331937 41 14.267499 40.033606 14.142578 38.740234 L 11.650391 13 z M 20.476562 17.978516 A 1.50015 1.50015 0 0 0 19 19.5 L 19 34.5 A 1.50015 1.50015 0 1 0 22 34.5 L 22 19.5 A 1.50015 1.50015 0 0 0 20.476562 17.978516 z M 27.476562 17.978516 A 1.50015 1.50015 0 0 0 26 19.5 L 26 34.5 A 1.50015 1.50015 0 1 0 29 34.5 L 29 19.5 A 1.50015 1.50015 0 0 0 27.476562 17.978516 z"></path>
</svg></span>
          </div> 
          </div>
        `;
      if (tareaElemento.etiquetas && tareaElemento.etiquetas.length > 0) {
        const etiquetasDiv = tareaDiv.querySelector(".ulEtiquetas");
        tareaElemento.etiquetas.forEach((etiqueta) => {
          const li = document.createElement("li");
          li.className = "etiqueta";
          li.textContent = etiqueta.nombre;
          etiquetasDiv.appendChild(li);
        });
      }

      componenteTareas.appendChild(tareaDiv);
    });
  },

  actualizarRenderTarea(componenteTareas, tareaActualizada) {
    console.log("TAREA ACTUALIZAAAAA",tareaActualizada.idTarea)
    // Encuentra el contenedor de la tarea por ID
    const tareaDiv = componenteTareas.querySelector(
      `#tarea-${tareaActualizada.idTarea}`
    );
    console.log("id", tareaActualizada.idTarea);

    if (tareaDiv) {
      // Actualiza el contenido de la tarea
      tareaDiv.querySelector("h3").textContent = tareaActualizada.nombre;
      tareaDiv.querySelector(".fechaActualizada").textContent =
        tareaActualizada.fechaUltimaActualizacion;

      const descripcionElemento = tareaDiv.querySelector(".textoTarea");
      //Si la tarea tiene descripcion se muestra el elemento html de la descripcion con
      //la descripcion cargada
      if (tareaActualizada.descripcion) {
        if (descripcionElemento) {
          descripcionElemento.textContent = tareaActualizada.descripcion;
          descripcionElemento.style.display = "block";
          descripcionElemento.classList.remove("hidden");
        }
        //Si no tiene descripcion se oculta el elemento html donde va la descripcion
      } else if (descripcionElemento) {
        descripcionElemento.classList.add("hidden");
        descripcionElemento.style.display = "none";
      }

      // Actualizar la prioridad, si la tiene
      const prioridadContainter = tareaDiv.querySelector(
        ".prioridad-container"
      );
      if (tareaActualizada.prioridad) {
        const prioridadBarra = tareaDiv.querySelector(".prioridad-barra");
        if (prioridadContainter) {
          prioridadBarra.style.width = `${tareaActualizada.prioridad * 20}%`;
          prioridadBarra.querySelector(".prioridad-numero").textContent =
            tareaActualizada.prioridad;
          prioridadContainter.classList.remove("hidden");
        }
        //Se oculta el elemento html donde se muestra a prioridad si la tarea no tiene
      } else {
        prioridadContainter.classList.add("hidden");
      }

      // Actualizar etiquetas
      const etiquetasContenedor = tareaDiv.querySelector(
        ".etiquetas-container"
      );

      //Verifica que la tarea tenga eiquetas, si las tiene muestra el html para mostrar las etiquetas y las carga
      // si no las tiene se asegura de ocultar el html contenedor donde se muestran las etiquetas
      if (tareaActualizada.etiquetas && tareaActualizada.etiquetas.length > 0) {
        const etiquetasUl = tareaDiv.querySelector(".ulEtiquetas");
        if (etiquetasUl) {
          etiquetasUl.innerHTML = ""; // Limpiar las etiquetas existentes
          tareaActualizada.etiquetas.forEach((etiqueta) => {
            const li = document.createElement("li");
            li.className = "etiqueta";
            li.textContent = etiqueta.nombre;
            etiquetasUl.appendChild(li);
          });
        }
        if (etiquetasContenedor) {
          etiquetasContenedor.style.display = "block";
          etiquetasContenedor.classList.remove("hidden");
        }
      } else {
        if (etiquetasContenedor) {
          etiquetasContenedor.classList.add("hidden");
          etiquetasContenedor.style.display = "none";
        }
      }
    } else {
      console.error("No se encontró la tarea para actualizarla.");
    }
  },

  eliminarRenderEspecifico(contenedor, componenteTarea) {
    if (componenteTarea) {
      contenedor.removeChild(componenteTarea);
    }
  },

  mostrarModalDetalleTarea(modalDetalle, tarea) {
    console.log("EJECUTANDOSE RENDER MODAL DETALLE TAREA")
    const inputTituloDetalle = modalDetalle.querySelector(".tituloTarea");
    const descripcionDetalle = modalDetalle.querySelector(".descripcionTarea");
    const fechaInput = modalDetalle.querySelector("#fechaInputModal");
    const contenedorPrioridad = modalDetalle.querySelector(".campoPrioridad");

    inputTituloDetalle.setAttribute("data-id", tarea.idTarea);

    const listaEtiquetas = modalDetalle.querySelector("#listaEtiquetas");
    const inputEtiqueta = modalDetalle.querySelector("#contenedorInput");
    const consultadas = modalDetalle.querySelector("#consultadas");

    inputTituloDetalle.value = tarea.nombre;
    if (tarea.descripcion || tarea.descripcion !== "") {
      descripcionDetalle.value = tarea.descripcion;
    }

    if(tarea.fechaProgramada){
      fechaInput.value=this.convertirAFormatoDateTimeLocal(tarea.fechaProgramada);
     // console.log("FECHA"+tarea.fechaProgramada);
    }
    //Se quita el campo de prioridad si la tarea no tiene prioridad
    if (tarea.prioridad) {
      const prioridadRadio = contenedorPrioridad.querySelector(
        `input[name="prioridad"][value="${tarea.prioridad}"]`
      );
      prioridadRadio.checked = true;
    }

    //Enviar a cargar las etiquetas
    if (tarea.etiquetas) {
      componentesEtiquetas.agregarEtiquetaInput(
        tarea.etiquetas,
        listaEtiquetas,
        consultadas,
        inputEtiqueta
      );
    }

    //Para que se desplegue si no esta desplegado y si ya lo esta solo va a actulizar sus datos
    if (modalDetalle.style.display !== "flex") {
      modalDetalle.style.display = "flex";
    }
  },

  //Muestra el modal y cambia texto de los botones ya que al mostrar detalle se cambia
  mostrarModal(modal) {
    const btnLimpiarEliminarModal = modal.querySelector(
      ".limpiarRestaurarModal"
    );
    const btnAgregarModal = modal.querySelector(".agregarModal");
    const descripcionDetalle = modal.querySelector(".descripcionTarea");

    const prioridad = modal.querySelector(".campoPrioridad");

    const fechaInput = modal.querySelector("#fechaInputModal");
  

    // Formateo la fecha actual al formato valido por el input para establecer
    //como fecha minima
   const fechaFormateada=this.formatearFechaDateInput(new Date());

    btnAgregarModal.textContent = "Agregar";
    btnLimpiarEliminarModal.textContent = "Limpiar";
    descripcionDetalle.style.display = "block";
    fechaInput.setAttribute("min", fechaFormateada);
    prioridad.style.display = "block";
    modal.style.display = "flex";
  },
  ocultarModal(modal) {
    if (modal) {
      modal.style.display = "none";
    }
  },

 // Variable para almacenar el ID del temporizador

//  mostrarMensajeFlotante(mensaje) {
//     const toast = document.querySelector(".toast");
  
//     // Si el toast ya está visible, no hacer nada
//     if (toast.classList.contains("mostrar")) {
//       return;
//     }
  
//     // Limpiar el temporizador anterior si existe
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
  
//     // Asignar el mensaje y mostrar el toast
//     toast.textContent = mensaje ? mensaje : "";
//     toast.classList.add("mostrar");
  
//     // Iniciar un nuevo temporizador para ocultar el toast
//     timeoutId = setTimeout(() => {
//       toast.classList.remove("mostrar");
//       timeoutId = null; // Reiniciar el ID del temporizador
//     }, 2000); // 2 segundos
//   },

  formatearFechaDateInput(fecha) {
    // Formatear la fecha en YYYY-MM-DD
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // Los meses empiezan en 0
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    const fechaFormateada = `${anio}-${mes}-${dia}T${horas}:${minutos}`;
    return fechaFormateada;

  },
  //Formatea la fecha para que se pueda mandar al elemento html inout tipo "datetime-local"
  convertirAFormatoDateTimeLocal(fechaOriginal) {
    const fecha=new Date(fechaOriginal);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Los meses comienzan en 0
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
  
    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
  },
  
};
