

export const etiquetasSeleccionadas = []; // Almacenar etiquetas que se van seleccionando

const etiquetas = []; // Para almacenar las etiquetas consultadas

export const componentesEtiquetas = {
  //Para mostrar las etiquetas que el usuario va agregando a la tarea
  renderizarEtiquetas(listaEtiquetas) {
    listaEtiquetas.innerHTML = "";
    etiquetasSeleccionadas.forEach((etiqueta) => {
      const li = document.createElement("li");
      if (etiqueta.idEtiqueta) {
        li.setAttribute("data-id", etiqueta.idEtiqueta);
      }
      li.textContent = etiqueta.nombre; 

      const botonEliminar = document.createElement("span");
      botonEliminar.textContent = " x";
      botonEliminar.className = "btnEliminarEtiqueta";

      botonEliminar.addEventListener("click", () => {
        const nombreEtiqueta = li.textContent.split(" ");
        this.eliminar(nombreEtiqueta[0].trim());
        li.remove();
      
      });

      li.appendChild(botonEliminar);
      
      listaEtiquetas.appendChild(li);
    });
  },

  // Método para eliminar una etiqueta de las seleccionadas
  eliminar(nombre) {
    let indice = etiquetasSeleccionadas.findIndex(
      (etiqueta) => etiqueta.nombre === nombre
    );

    if (indice !== -1) {
      etiquetasSeleccionadas.splice(indice, 1);
      console.log("Etiquetas actuales:",etiquetasSeleccionadas);
    }
  },

  // Método para mostrar las etiquetas del usuario guardadas en la base de datos
  async mostrarEtiquetasConsultadas(
    query,
    contenedorConsultadas,
    inputEtiqueta,
    etiquetasConsultadas
  ) {
    contenedorConsultadas.innerHTML = ""; // Limpiar sugerencias previas
    if (query) {
    
      etiquetas.length = 0;
      etiquetasConsultadas.forEach((el) => etiquetas.push(el));

      // Filtra para mostrar las que coincidan con el query(ingreso el usuario) y que no han sido agregadas previamente en el input
      const etiquetasFiltradas = etiquetasConsultadas.filter(
        (etiqueta) =>
          etiqueta.nombre.toLowerCase().includes(query.toLowerCase()) &&
          !etiquetasSeleccionadas.find((el) => el.nombre === etiqueta.nombre)
      );

      if (etiquetasFiltradas.length > 0) {
        etiquetasFiltradas.forEach((etiqueta) => {
          const li = document.createElement("li");
          li.textContent = etiqueta.nombre;
          li.setAttribute("data-id", etiqueta.idEtiqueta);
          li.addEventListener("click", () => {
            this.agregarEtiquetaInput(
              etiqueta,
              listaEtiquetas,
              contenedorConsultadas,
              inputEtiqueta
            );
          });
          contenedorConsultadas.appendChild(li);
        });

        contenedorConsultadas.classList.add("active"); // Mostrar sugerencias
      } else {
        contenedorConsultadas.classList.remove("active");
      }
    } else {
      contenedorConsultadas.classList.remove("active"); // Ocultar sugerencias si no hay texto
    }
  },

  // Método para agregar una etiqueta que esta en el input
  agregarEtiquetaInput(
    etiqueta,
    listaEtiquetas,
    contenedorConsultadas,
    inputEtiqueta
  ) {

    if(!Array.isArray(etiqueta)){
      etiqueta=[etiqueta];
    }
    etiqueta.forEach(el=>{
    etiquetasSeleccionadas.push(el);
  });
    this.renderizarEtiquetas(listaEtiquetas);
    inputEtiqueta.value = ""; // Limpiar el input
    this.mostrarEtiquetasConsultadas("", contenedorConsultadas); // Limpiar sugerencias
  },

  // Método para buscar coincidencias, si es un objeto quiere decir que esta registrada y se regresa tal cual, si no se regresa solo un
  // objeto con la clave "nombre:" y el valor
  buscarCoincidencias(etiqueta) {
    const etiquetaRegistrada = etiquetas.find(
      (el) => el.nombre.toLowerCase() === etiqueta.toLowerCase()
    );

    const seleccionada = etiquetasSeleccionadas.find(
      (el) => el.nombre.toLowerCase() === etiqueta.toLowerCase()
    );

    if (seleccionada) {
      return false;
    } else if (typeof etiqueta === "object") {
      return etiqueta;
    }

    return etiquetaRegistrada ? etiquetaRegistrada : { nombre: etiqueta };
  },
};
