export const rendersTareas = {
  renderizarTareas(componenteTareas, listaTareas) {
    console.log(listaTareas);
    listaTareas.forEach((tareaElemento) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "tarea";
      tareaDiv.innerHTML = `
      <div class="principal">
         <div class="contendorTarea" value="${tareaElemento.idTarea}">
          <h3>${tareaElemento.nombre}</h3>
           <p class="fechaActualidada">${tareaElemento.fechaUltimaActualizacion}</p>
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
  }" class="checkbox-completado"  value="${tareaElemento}"/>
  <label for="completado-${tareaElemento.idTarea}" class="checkbox-label"></label>
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

  eliminarRenderEspecifico(contenedor,componenteTarea){
    if(componenteTarea){
      contenedor.removeChild(componenteTarea);
    }
  }
};
