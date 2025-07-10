let timeoutId = null; 
// Obtener elementos del DOM


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

    // Función para actualizar el contador de caracteres

 /**
  * Verifica el numero de caracteres ingresados en el elemento de entrada
  * Si se excede el límite de caracteres permitidos muestra el mensaje y si no lo mantiene oculto.
  * @param {HTMLInputElement | HTMLTextAreaElement} input -  El elemento de entrada (input o textarea)
  * @param {*} elementoMensaje - El elemento donde se mostrara el mensaje de limite de caracteres
  * @param {*} maxLength - El numer maximo de caracteres permitidos en el elemento de entrada
  */
  actualizarContador(input, elementoMensaje, maxLength) {
    console.log("se llamo");
    const caracteresRestantes = maxLength - input.value.length;
 

    // Mostrar un mensaje si se excede el límite
    if (caracteresRestantes <= 0) {
      
      if(elementoMensaje.classList.contains("hidden")){
      elementoMensaje.classList.remove("hidden");
      }
    } else {
      if(!elementoMensaje.classList.contains("hidden")){
        elementoMensaje.classList.add("hidden");
      }
  
    }
  },

}
