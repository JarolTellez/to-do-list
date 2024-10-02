const botonAgregarTarea = document.querySelector("#agregar_tarea");
const modal = document.querySelector('#miModal');
const btnCancelarModal=document.querySelector(".cancelarModal");





const generarElementoTarea = () => {
  modal.style.display = 'flex';
};

const cerrarModal=()=>{
    modal.style.display = 'none';
}


btnCancelarModal.addEventListener("click",cerrarModal);
botonAgregarTarea.addEventListener("click", generarElementoTarea);
