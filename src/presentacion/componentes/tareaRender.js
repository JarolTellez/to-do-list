export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas) {
    listaTareas.forEach((tarea) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.innerHTML = `
         <div class="contendorTarea">
          <h3>${tarea.tarea_nombre}</h3>
           ${tarea.tarea_descripcion ? `<p>${tarea.tarea_descripcion}</p>` : ""}
          <p>Última actualización: ${tarea.tarea_ultima_actualizacion}</p>
           ${
             tarea.tarea_prioridad
               ? `<p>Prioridad: ${tarea.tarea_prioridad}</p>`
               : ""
           }
           ${
             tarea.etiquetas && tarea.etiquetas.length > 0
               ? `<div class="etiquetas">
            <strong>Etiquetas:</strong>
             <ul class="ulEtiquetas"></ul>
          </div>`
               : ""
           }
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

