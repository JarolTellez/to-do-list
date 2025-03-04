let timeoutId = null; 

export const rendersMensajes={

    mostrarError(mensaje){
        const toast = document.querySelector(".toast");
  
        // Si el toast ya está visible, no hacer nada
        if (toast.classList.contains("mostrar")) {
          return;
        }
      
        // Limpiar el temporizador anterior si existe
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      
        // Asignar el mensaje y mostrar el toast
        toast.textContent = mensaje ? mensaje : "";
        toast.classList.add("error");
        toast.classList.add("mostrar");
      
        // Iniciar un nuevo temporizador para ocultar el toast
        timeoutId = setTimeout(() => {
          
          toast.classList.remove("mostrar");
         
          timeoutId = null; // Reiniciar el ID del temporizador
        }, 2000); // 2 segundos
    },
    mostrarMensaje(mensaje){
        const toast = document.querySelector(".toast");
  
        // Si el toast ya está visible, no hacer nada
        if (toast.classList.contains("mostrar")) {
          return;
        }
      
        // Limpiar el temporizador anterior si existe
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      
        // Asignar el mensaje y mostrar el toast
        toast.textContent = mensaje ? mensaje : "";
        toast.classList.remove("error");
        toast.classList.add("mostrar");
      
        // Iniciar un nuevo temporizador para ocultar el toast
        timeoutId = setTimeout(() => {
          toast.classList.remove("mostrar");
          timeoutId = null; // Reiniciar el ID del temporizador
        }, 2000); // 2 segundos
    }
}