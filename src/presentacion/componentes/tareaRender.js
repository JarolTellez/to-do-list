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
             <ul id="listaEtiquetas" class="ulEtiquetas"></ul>
          </div>
        `;

      const etiquetasDiv = tareaDiv.querySelector(".ulEtiquetas");

      if (tarea.etiquetas && tarea.etiquetas.length > 0) {
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
