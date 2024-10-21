import {componentesEtiquetas}from"../componentes/etiquetaRender.js";
export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas) {
    //PARA LIMPIAR
    componenteTareas.innerHTML='';
    console.log(listaTareas);
    listaTareas.forEach((tareaElemento) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.innerHTML = `
      <div class="principalTarea" id="${tareaElemento.idTarea}">
         <div class="contendorTarea" value="${tareaElemento.idTarea}">
          <h3>${tareaElemento.nombre}</h3>
           <p class="fechaActualidada">${
             tareaElemento.fechaUltimaActualizacion
           }</p>
           ${
             tareaElemento.descripcion
               ? `<p class="textoTarea">${tareaElemento.descripcion}</p>`
               : ""
           }
         
            ${
              tareaElemento.prioridad
                ? `<div class="prioridad-container">
           <span class="prioridad-text">Prioridad</span>
           <div class="prioridad-barra" style="width: ${
             tareaElemento.prioridad * 20
           }%; background: linear-gradient(to right, rgba(0, 128, 0, 0.3), rgba(0, 128, 0, 1));">
             <span class="prioridad-numero">${tareaElemento.prioridad}</span>
           </div>
         </div>`
                : ""
            }
           ${
             tareaElemento.etiquetas && tareaElemento.etiquetas.length > 0
               ? `  <strong>Etiquetas:</strong>
               <div class="etiquetas scrollEtiqueta">
          
             <ul class="ulEtiquetas"></ul>
          </div>`
               : ""
           }
           <div class="completado-container">
  <input type="checkbox" id="completado-${
    tareaElemento.idTarea
  }" class="checkbox-completado"  value="${tareaElemento.idTarea}"/>
  <label for="completado-${
    tareaElemento.idTarea
  }" class="checkbox-label"></label>
</div>
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

  eliminarRenderEspecifico(contenedor, componenteTarea) {
    if (componenteTarea) {
      contenedor.removeChild(componenteTarea);
    }
  },

  mostrarModalDetalleTarea(modalDetalle, tarea) {
    const inputTituloDetalle = modalDetalle.querySelector(
      ".tituloTarea"
    );
    const descripcionDetalle = modalDetalle.querySelector(
      ".descripcionTarea"
    );
   
    const contenedorPrioridad = modalDetalle.querySelector(
      ".campoPrioridad"
    );
   
    inputTituloDetalle.setAttribute("data-id", tarea.idTarea);

    const listaEtiquetas=modalDetalle.querySelector("#listaEtiquetas");
    const inputEtiqueta=modalDetalle.querySelector("#contenedorInput");
    const consultadas=modalDetalle.querySelector("#consultadas");
   
    inputTituloDetalle.value = tarea.nombre;
    if (!tarea.descripcion || tarea.descripcion === "") {
      descripcionDetalle.style.display = "none";
    //  descripcionLabel.style.display = "none";
    } else {
      descripcionDetalle.style.display = "block";
    //descripcionLabel.style.display = "block";
      descripcionDetalle.value = tarea.descripcion;
    }
    // fechaCreacion.textContent = tarea.fechaCreacion;
    // fechaUltimaActualizacion.textContent = tarea.fechaUltimaActualizacion;

    //Se quita el campo de prioridad si la tarea no tiene prioridad
    if (!tarea.prioridad) {
      contenedorPrioridad.style.display = "none";
     
    } else {
      contenedorPrioridad.style.display = "block";
      const prioridadRadio = contenedorPrioridad.querySelector(
        `input[name="prioridad"][value="${tarea.prioridad}"]`
      );
      prioridadRadio.checked = true;
    }

    //Enviar a cargar las etiquetas
    if(tarea.etiquetas){
      componentesEtiquetas.agregarEtiquetaInput(tarea.etiquetas,listaEtiquetas,consultadas,inputEtiqueta);

    }

    //Para que se desplegue si no esta desplegado y si ya lo esta solo va a actulizar sus datos
    if(modalDetalle.style.display !=="flex"){
    modalDetalle.style.display = "flex";
    }
  
  },
  

  //Muestra el modal y cambia texto de los botones ya que al mostrar detalle se cambia 
  mostrarModal(modal){
    const btnLimpiarEliminarModal = modal.querySelector(".limpiarRestaurarModal");
  const btnAgregarModal=modal.querySelector(".agregarModal");
    const descripcionDetalle = modal.querySelector(
      ".descripcionTarea"
    );

    btnAgregarModal.textContent="Agregar";
    btnLimpiarEliminarModal.textContent="Limpiar";
    descripcionDetalle.style.display="block";
    modal.style.display="flex";
  },
  ocultarModal(modal) {
    if (modal) {
      modal.style.display = "none";
    }
  },
};
