let timeoutId = null; 

export const rendersMensajes={

    mostrarToast(mensaje, esError = false) {
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
        toast.textContent = mensaje || "";
    
        // Agregar o remover la clase de error según el parámetro
        if (esError) {
          toast.classList.add("error");
        } else {
          toast.classList.remove("error");
        }
    
        toast.classList.add("mostrar");
    
        // Iniciar un nuevo temporizador para ocultar el toast
        timeoutId = setTimeout(() => {
          toast.classList.remove("mostrar");
          timeoutId = null; // Reiniciar el ID del temporizador
        }, 2000); // 2 segundos
      },
    
}