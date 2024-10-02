export const etiquetasSeleccionadas = [];
const etiquetas = []; // Para almacenar las etiquetas seleccionadas

document.addEventListener("DOMContentLoaded", function () {
const inputEtiqueta = document.getElementById("contenedorInput");
  const listaEtiquetas = document.getElementById("listaEtiquetas");
  const contenedorConsultadas = document.getElementById("consultadas");
 
  
 
  
  // Función para cargar las etiquetas desde el servidor
  window.addEventListener("load", cargarEtiquetas);

  
  async function cargarEtiquetas() {
    const urlEtiquetas = "http://localhost:3000/etiqueta/";
    const idUsuario = { idUsuario: sessionStorage.getItem("idUsuario") };
    console.log("ID USUARIO DESDE TAREAS: ", idUsuario);

    try {
      const response = await fetch(urlEtiquetas, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(idUsuario),
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar las etiquetas");
      }

      const result = await response.json();

      return result.data;

      // return result.data.map((etiqueta) => etiqueta.nombre); // Devolver solo los nombres de las etiquetas
    } catch (error) {
      console.log(error.message);
      alert("Error al consultar las etiquetas: ", error.message);
      return [];
    }
  }

  // Función para renderizar las etiquetas seleccionadas
  function renderizarEtiquetas() {
    console.log("ETIQUETAS SELECCIONADAS:", etiquetasSeleccionadas);
    listaEtiquetas.innerHTML = ""; // Limpiar las etiquetas anteriores
    etiquetasSeleccionadas.forEach((etiqueta) => {
      const li = document.createElement("li");
      if (etiqueta.idEtiqueta) {
        li.setAttribute("data-id", etiqueta.idEtiqueta);
      }
      li.textContent = etiqueta.nombre;

      const botonEliminar = document.createElement("span");
      botonEliminar.textContent = " x";
      botonEliminar.className="btnEliminarEtiqueta"
    

      botonEliminar.addEventListener("click", () => {
        const nombreEtiqueta = li.textContent.split(" ");
        eliminar(nombreEtiqueta[0].trim());
        li.remove();
      });

      li.appendChild(botonEliminar);

      listaEtiquetas.appendChild(li);
    });
  }

  function eliminar(nombre) {
    console.log(nombre);

    let indice = etiquetasSeleccionadas.findIndex(
      (etiqueta) => etiqueta.nombre == nombre
    );

    if (indice !== -1) {
      etiquetasSeleccionadas.splice(indice, 1);
    }
  }

  // Función para mostrar las sugerencias
  async function mostrarEtiquetasConsultadas(query) {
    contenedorConsultadas.innerHTML = ""; // Limpiar sugerencias previas
    if (query) {
      const etiquetasConsultadas = await cargarEtiquetas(); // Cargar etiquetas dinámicamente
      etiquetas.length = 0;
      etiquetasConsultadas.forEach((el) => etiquetas.push(el));

      //Filtra para mostrar las que coincidan y que no han sido agregadas previamente en el input
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
            agregarEtiquetaInput(etiqueta);
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
  }

  // Función para agregar una etiqueta
  function agregarEtiquetaInput(etiqueta) {
    etiquetasSeleccionadas.push(etiqueta);
    renderizarEtiquetas();
    inputEtiqueta.value = ""; // Limpiar el input
    mostrarEtiquetasConsultadas(""); // Limpiar sugerencias
  }

  function buscarCoincidencias(etiqueta) {
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
  }

  // Evento para capturar el texto que ingresa el usuario
  inputEtiqueta.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (query) {
      mostrarEtiquetasConsultadas(query);
    } else {
      contenedorConsultadas.classList.remove("active"); // Ocultar sugerencias si no hay texto
    }
  });

  // Evento para manejar cuando el usuario haga enter o de click
  inputEtiqueta.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      const query = inputEtiqueta.value.trim();
      const etiquetaEnviada = buscarCoincidencias(query);
      console.log("etiqueta:", etiquetaEnviada);
      if (etiquetaEnviada) {
        agregarEtiquetaInput(etiquetaEnviada);
      }
      inputEtiqueta.value = "";
    }
  });
});
