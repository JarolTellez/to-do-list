export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas) {
    listaTareas.forEach((tarea) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.innerHTML = `
      <div class="principal">
         <div class="contendorTarea" value="${tarea.tarea_id}">
          <h3>${tarea.tarea_nombre}</h3>
           <p class="fechaActualidada">${tarea.tarea_ultima_actualizacion}</p>
           ${tarea.tarea_descripcion ? `<p class="textoTarea">${tarea.tarea_descripcion}</p>` : ""}
         
            ${tarea.tarea_prioridad 
      ? `<div class="prioridad-container">
           <span class="prioridad-text">Prioridad</span>
           <div class="prioridad-barra" style="width: ${tarea.tarea_prioridad * 20}%; background: linear-gradient(to right, rgba(0, 128, 0, 0.3), rgba(0, 128, 0, 1));">
             <span class="prioridad-numero">${tarea.tarea_prioridad}</span>
           </div>
         </div>`
      : ""}
           ${
             tarea.etiquetas && tarea.etiquetas.length > 0
               ? `  <strong>Etiquetas:</strong>
               <div class="etiquetas scrollEtiqueta">
          
             <ul class="ulEtiquetas"></ul>
          </div>`
               : ""
           }
          </div> 
          </div>
        `;
      if (tarea.etiquetas && tarea.etiquetas.length > 0) {
        const etiquetasDiv = tareaDiv.querySelector(".ulEtiquetas");
        tarea.etiquetas.forEach((etiqueta) => {
          const li = document.createElement("li");
          li.className = "etiqueta";
          li.textContent = etiqueta.nombre;
          etiquetasDiv.appendChild(li);
        });
      }

      componenteTareas.appendChild(tareaDiv);
    });
  },
};
