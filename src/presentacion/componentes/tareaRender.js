export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas) {
    listaTareas.array.forEach((element) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.innerHTML = `
          <h3>${tarea.nombre}</h3>
          <p>${tarea.descripcion}</p>
          <p>Creada el: ${tarea.fechaCreacion}</p>
          <p>Última actualización: ${tarea.fechaUltimaActualizacion}</p>
          <p>Prioridad: ${tarea.prioridad}</p>
          <div class="etiquetas">
            <strong>Etiquetas:</strong>
          </div>
        `;

        const etiquetasDiv = tareaDiv.querySelector('.etiquetas');
        listaTareas.etiquetas.forEach((etiqueta) => {
            const etiquetaSpan = document.createElement('span');
            etiquetaSpan.className = 'etiqueta';
            etiquetaSpan.textContent = etiqueta.nombreEtiqueta;
            etiquetasDiv.appendChild(etiquetaSpan);
        });

        componenteTareas.appendChild(tareaDiv);
 
    });
  },
};
