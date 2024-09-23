const botonAgregarTarea = document.querySelector("#agregar_tarea");
const modal = document.querySelector('#miModal');
const btnCancelarModal=document.querySelector(".cancelarModal");





const generarElementoTarea = () => {
 /* const contenedorTareas = document.getElementById("lista_tareas");
  const ultimoAgregado = contenedorTareas.lastElementChild;

  if (ultimoAgregado) {
    const titulo = ultimoAgregado.querySelector(".titulo_tarea").value.trim();
    if (titulo == "") {
      return;
    }
  }

  const taskTemplate = document.getElementById("template_tarea").content;
  const newTask = document.importNode(taskTemplate, true);
  contenedorTareas.appendChild(newTask);*/
  modal.style.display = 'flex';
};

const cerrarModal=()=>{
    modal.style.display = 'none';
}


btnCancelarModal.addEventListener("click",cerrarModal);
botonAgregarTarea.addEventListener("click", generarElementoTarea);
