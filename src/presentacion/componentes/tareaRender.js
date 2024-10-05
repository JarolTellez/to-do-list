export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas) {
    listaTareas.forEach((tarea) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.innerHTML = `
          <h3>${tarea.tarea_nombre}</h3>
          <p>${tarea.tarea_descripcion}</p>
          <p>Creada el: ${tarea.tarea_fecha_creacion}</p>
          <p>Última actualización: ${tarea.tarea_ultima_actualizacion}</p>
          <p>Prioridad: ${tarea.tarea_prioridad}</p>
          <div class="etiquetas">
            <strong>Etiquetas:</strong>
          </div>
        `;

      const etiquetasDiv = tareaDiv.querySelector(".etiquetas");

      if (tarea.etiquetas && tarea.etiquetas.length > 0) {
        tarea.etiquetas.forEach((etiqueta) => {
          const etiquetaSpan = document.createElement("span");
          etiquetaSpan.className = "etiqueta";
          etiquetaSpan.textContent = etiqueta.nombreEtiqueta;
          etiquetasDiv.appendChild(etiquetaSpan);
        });
      }

      componenteTareas.appendChild(tareaDiv);
    });
  },
};
