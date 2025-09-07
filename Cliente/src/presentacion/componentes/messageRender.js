let timeoutId = null; 
// Obtener elementos del DOM


export const messageRender={

    showToast(message, isError = false) {
        const toast = document.querySelector(".toast");
    
        // Si el toast ya está visible, no hacer nada
        if (toast.classList.contains("mostrar")) {
          return;
        }
    
        // Limpiar el temporizador anterior si existe
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
    
        // Asignar el message y mostrar el toast
        toast.textContent = message || "";
    
        // Agregar o remover la clase de error según el parámetro
        if (isError) {
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

    // Función para actualizar el contador de caracteres

 /**
  * Verifica el numero de caracteres ingresados en el elemento de entrada
  * Si se excede el límite de caracteres permitidos muestra el message y si no lo mantiene oculto.
  * @param {HTMLInputElement | HTMLTextAreaElement} input -  El elemento de entrada (input o textarea)
  * @param {*} messageElement - El elemento donde se mostrara el message de limite de caracteres
  * @param {*} maxLength - El numer maximo de caracteres permitidos en el elemento de entrada
  */
  updateCounter(input, messageElement, maxLength) {
    const remainChars = maxLength - input.value.length;
 

    // Mostrar un message si se excede el límite
    if (remainChars <= 0) {
      
      if(messageElement.classList.contains("hidden")){
      messageElement.classList.remove("hidden");
      }
    } else {
      if(!messageElement.classList.contains("hidden")){
        messageElement.classList.add("hidden");
      }
  
    }
  },

}
