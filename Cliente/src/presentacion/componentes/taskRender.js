import { tagComponent } from "./tagRender.js";
import { formatearFechaRender } from "../../core/utils/formatDate.js";
//let timeoutId = null; 
export const taskRender = {
  renderTasks(tasksContainer, tasksList, clear,message) {
    //PARA LIMPIAR
    if (clear && clear === true) {
      tasksContainer.innerHTML = "";
    }
    
    if(tasksList.length<=0 && message){
      tasksContainer.innerHTML = message;
      return;
    }
    console.log("Renderizando", tasksList);
    tasksList.forEach((taskElement) => {
      const tareaDiv = document.createElement("div");
      tareaDiv.className = "task";
      tareaDiv.id = `tareaDiv-${taskElement.id}`;
      tareaDiv.innerHTML = `
      <div class="principalTarea" id="task-${taskElement.id}">
         <div class="contenedorTarea" value="${taskElement.id}">
          <h3 class="scrollTituloDescripcion">${taskElement.name}</h3>
           <p class="fechaActualizada"> 
         ${taskElement.scheduledDate?`<span class='calendario'>📅</span>`+ formatearFechaRender(taskElement.scheduledDate):""}</p>
           ${`<p class="scrollTituloDescripcion descripcionRender ${
             !taskElement.description ? "hidden" : "" } textTarea">
     ${taskElement.description || ""}
   </p>`}
         
            ${`<div class="priority-container ${
              !taskElement.priority ? "hidden" : ""
            }">
   <span class="priority-text">Prioridad</span>
   <div class="priority-bar" style="width: ${
     taskElement.priority ? taskElement.priority* 20 : ""
   }%; background: linear-gradient(to right, rgba(0, 128, 0, 0.3), rgba(0, 128, 0, 1));">
     <span class="priority-number">${
       taskElement.priority ? taskElement.priority : ""
     }</span>
   </div>
 </div>`}
           ${
             taskElement.tags && taskElement.tags.length > 0
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
    taskElement.id
  }" class="checkbox-completado"  value="${taskElement.id}" ${
        taskElement.isCompleted > 0 ? "checked disabled" : ""
      }/>
  <label for="completado-${
    taskElement.id
  }" class="checkbox-label"></label>
</div>

 <span class="btn-eliminar" data-id="${taskElement.id}"> <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 48 48">
<path d="M 24 4 C 20.491685 4 17.570396 6.6214322 17.080078 10 L 10.238281 10 A 1.50015 1.50015 0 0 0 9.9804688 9.9785156 A 1.50015 1.50015 0 0 0 9.7578125 10 L 6.5 10 A 1.50015 1.50015 0 1 0 6.5 13 L 8.6386719 13 L 11.15625 39.029297 C 11.427329 41.835926 13.811782 44 16.630859 44 L 31.367188 44 C 34.186411 44 36.570826 41.836168 36.841797 39.029297 L 39.361328 13 L 41.5 13 A 1.50015 1.50015 0 1 0 41.5 10 L 38.244141 10 A 1.50015 1.50015 0 0 0 37.763672 10 L 30.919922 10 C 30.429604 6.6214322 27.508315 4 24 4 z M 24 7 C 25.879156 7 27.420767 8.2681608 27.861328 10 L 20.138672 10 C 20.579233 8.2681608 22.120844 7 24 7 z M 11.650391 13 L 36.347656 13 L 33.855469 38.740234 C 33.730439 40.035363 32.667963 41 31.367188 41 L 16.630859 41 C 15.331937 41 14.267499 40.033606 14.142578 38.740234 L 11.650391 13 z M 20.476562 17.978516 A 1.50015 1.50015 0 0 0 19 19.5 L 19 34.5 A 1.50015 1.50015 0 1 0 22 34.5 L 22 19.5 A 1.50015 1.50015 0 0 0 20.476562 17.978516 z M 27.476562 17.978516 A 1.50015 1.50015 0 0 0 26 19.5 L 26 34.5 A 1.50015 1.50015 0 1 0 29 34.5 L 29 19.5 A 1.50015 1.50015 0 0 0 27.476562 17.978516 z"></path>
</svg></span>
          </div> 
          </div>
        `;
      if (taskElement.tags && taskElement.tags.length > 0) {
        const tagsDiv = tareaDiv.querySelector(".ulEtiquetas");
        taskElement.tags.forEach((tag) => {
          const li = document.createElement("li");
          li.className = "etiqueta";
          li.textContent = tag.name;
          tagsDiv.appendChild(li);
        });
      }

      tasksContainer.appendChild(tareaDiv);
    });
  },

  updateTaskRender(tasksContainer, updatedTask) {
    console.log("TAREA ACTUALIZAAAAA",updatedTask.id)
    // Encuentra el container de la task por ID
    const tareaDiv = tasksContainer.querySelector(
      `#task-${updatedTask.id}`
    );
    console.log("id", updatedTask.id);

    if (tareaDiv) {
      // Actualiza el contenido de la task
      tareaDiv.querySelector("h3").textContent = updatedTask.name;
      tareaDiv.querySelector(".fechaActualizada").textContent =
        updatedTask.lasUpdateDate;

      const elementDescription = tareaDiv.querySelector(".textoTarea");
      //Si la task tiene description se muestra el elemento html de la description con
      //la description cargada
      if (updatedTask.description) {
        if (elementDescription) {
          elementDescription.textContent = updatedTask.description;
          elementDescription.style.display = "block";
          elementDescription.classList.remove("hidden");
        }
        //Si no tiene description se oculta el elemento html donde va la description
      } else if (elementDescription) {
        elementDescription.classList.add("hidden");
        elementDescription.style.display = "none";
      }

      // Actualizar la priority, si la tiene
      const prioridadContainter = tareaDiv.querySelector(
        ".priority-container"
      );
      if (updatedTask.priority) {
        const priorityBar = tareaDiv.querySelector(".priority-bar");
        if (prioridadContainter) {
          priorityBar.style.width = `${updatedTask.priority * 20}%`;
          priorityBar.querySelector(".priority-number").textContent =
            updatedTask.priority;
          prioridadContainter.classList.remove("hidden");
        }
        //Se oculta el elemento html donde se muestra a priority si la task no tiene
      } else {
        prioridadContainter.classList.add("hidden");
      }

      // Actualizar etiquetas
      const etiquetasContenedor = tareaDiv.querySelector(
        ".etiquetas-container"
      );

      //Verifica que la task tenga eiquetas, si las tiene muestra el html para mostrar las etiquetas y las carga
      // si no las tiene se asegura de ocultar el html container donde se muestran las etiquetas
      if (updatedTask.tags && updatedTask.tags.length > 0) {
        const tagsUl = tareaDiv.querySelector(".ulEtiquetas");
        if (tagsUl) {
          tagsUl.innerHTML = ""; // Limpiar las etiquetas existentes
          updatedTask.etiquetas.forEach((etiqueta) => {
            const li = document.createElement("li");
            li.className = "etiqueta";
            li.textContent = etiqueta.name;
            tagsUl.appendChild(li);
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
      console.error("No se encontró la task para actualizarla.");
    }
  },

  deleteSpecificRender(container, taksComponent) {
    if (taksComponent) {
      container.removeChild(taksComponent);
    }
  },

  showTaskDetailModal(detailModal, task) {
    console.log("EJECUTANDOSE RENDER MODAL DETALLE TAREA")
    const inputTituloDetalle = detailModal.querySelector(".nameTask");
    const detailDescription = detailModal.querySelector(".taskDescription");
    const dateInput = detailModal.querySelector("#fechaInputModal");
    const priorityContainer = detailModal.querySelector(".campoPrioridad");

    inputTituloDetalle.setAttribute("data-id", task.id);

    const tagsList = detailModal.querySelector("#tagsList");
    const tagInput = detailModal.querySelector("#inputContainer");
    const consulted = detailModal.querySelector("#consulted");

    inputTituloDetalle.value = task.name;
    if (task.description || task.description !== "") {
      detailDescription.value = task.description;
    }

    if(task.scheduledDate){
      dateInput.value=this.convertirAFormatoDateTimeLocal(task.scheduledDate);
     // console.log("FECHA"+task.scheduledDate);
    }
    //Se quita el campo de priority si la task no tiene priority
    if (task.priority) {
      const priorityRadio = priorityContainer.querySelector(
        `input[name="priority"][value="${task.priority}"]`
      );
      priorityRadio.checked = true;
    }

    //Enviar a cargar las etiquetas
    if (task.tags) {
      tagComponent.addTagInput(
        task.tags,
        tagsList,
        consulted,
        tagInput
      );
    }

    //Para que se desplegue si no esta desplegado y si ya lo esta solo va a actulizar sus datos
    if (detailModal.style.display !== "flex") {
      detailModal.style.display = "flex";
    }
  },

  //Muestra el modal y cambia texto de los botones ya que al mostrar detalle se cambia
  showModal(modal) {
    const clearDeleteModalBtn = modal.querySelector(
      ".limpiarRestaurarModal"
    );
    const addModalBtn = modal.querySelector(".agregarModal");
    const detailDescription = modal.querySelector(".taskDescription");

    const priority = modal.querySelector(".campoPrioridad");

    const dateInput = modal.querySelector("#fechaInputModal");
  

    // Formateo la fecha actual al formato valido por el input para establecer
    //como fecha minima
   const formattedDate=this.formatDateForDateTimeInput(new Date());

    addModalBtn.textContent = "Agregar";
    clearDeleteModalBtn.textContent = "Limpiar";
    detailDescription.style.display = "block";
    dateInput.setAttribute("min", formattedDate);
    priority.style.display = "block";
    modal.style.display = "flex";
  },
  hideModal(modal) {
    if (modal) {
      modal.style.display = "none";
    }
  },

 // Variable para almacenar el ID del temporizador

//  mostrarMensajeFlotante(message) {
//     const toast = document.querySelector(".toast");
  
//     // Si el toast ya está visible, no hacer nada
//     if (toast.classList.contains("mostrar")) {
//       return;
//     }
  
//     // Limpiar el temporizador anterior si existe
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
  
//     // Asignar el message y mostrar el toast
//     toast.textContent = message ? message : "";
//     toast.classList.add("mostrar");
  
//     // Iniciar un nuevo temporizador para ocultar el toast
//     timeoutId = setTimeout(() => {
//       toast.classList.remove("mostrar");
//       timeoutId = null; // Reiniciar el ID del temporizador
//     }, 2000); // 2 segundos
//   },

formatDateForDateTimeInput(date) {
    // Format date to YYYY-MM-DDTHH:MM for datetime input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months start at 0
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    return formattedDate;
}, 

  //Formatea la fecha para que se pueda mandar al elemento html inout tipo "datetime-local"
 // Formats the date to be sent to HTML input of type "datetime-local"
convertToDateTimeLocalFormat(originalDate) {
    const date = new Date(originalDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months start at 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
},
  
};
