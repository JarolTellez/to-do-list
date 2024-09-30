document.addEventListener("DOMContentLoaded", function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const inputEtiqueta = document.getElementById('contenedorInput');
  const listaEtiquetas = document.getElementById('listaEtiquetas');
  const contenedorConsultadas = document.getElementById('consultadas');
  const btnAgregarTarea = document.querySelector(".agregarModal");
  const etiquetas = []; // Para almacenar las etiquetas seleccionadas

  btnAgregarTarea.addEventListener("click", function () {
    agregarTarea();
  });

  window.addEventListener("load", cargarEtiquetas);


  async function agregarTarea() {
    const prioridad = document.querySelector('input[name="prioridad"]:checked');

    const tareaNueva = {
      nombre: tituloTarea.value,
      descripcion: descripcionTarea.value,
      fechaCreacion: new Date().toISOString().slice(0, 19).replace("T", " "),
      fechaUltimaActualizacion: new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      completada: false,
      idUsuario: sessionStorage.getItem("idUsuario"),
      prioridad: prioridad.value,
    };
    console.log(tareaNueva);
    const urlTarea = "http://localhost:3000/tarea/";

    try {
      const response = await fetch(urlTarea, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tareaNueva),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        tituloTarea.value = "";
        descripcionTarea.value = "";
        alert("Se ha guardado correctamente la trea");
      } else {
        console.log("Error al Registrar la tarea:", data.mensaje);
        alert(data.mensaje);
      }
    } catch (error) {
      alert("Error al agregar la tarea: ", error.message);
    }
  }



// Función para cargar las etiquetas desde el servidor
async function cargarEtiquetas() {
  const urlEtiquetas = "http://localhost:3000/tarea/etiquetas";
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
    return result.data.map(etiqueta => etiqueta.nombre); // Devolver solo los nombres de las etiquetas
  } catch (error) {
    console.log(error.message);
    alert("Error al consultar las etiquetas: ", error.message);
    return [];
  }
}

// Función para renderizar las etiquetas seleccionadas
function renderTags() {
  listaEtiquetas.innerHTML = ''; // Limpiar las etiquetas anteriores
  etiquetas.forEach(tag => {
    const li = document.createElement('li');
    li.textContent = tag;
    listaEtiquetas.appendChild(li);
  });
}

// Función para mostrar las sugerencias
async function showSuggestions(query) {
  contenedorConsultadas.innerHTML = ''; // Limpiar sugerencias previas
  if (query) {
    const etiquetasConsultadas = await cargarEtiquetas(); // Cargar etiquetas dinámicamente
    const filteredTags = etiquetasConsultadas.filter(etiqueta => etiqueta.toLowerCase().includes(query.toLowerCase()) && !etiquetas.includes(etiqueta));

    if (filteredTags.length > 0) {
      filteredTags.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        li.addEventListener('click', () => {
          addTag(tag);
        });
        contenedorConsultadas.appendChild(li);
      });

      contenedorConsultadas.classList.add('active'); // Mostrar sugerencias
    } else {
      contenedorConsultadas.classList.remove('active');
    }
  } else {
    contenedorConsultadas.classList.remove('active'); // Ocultar sugerencias si no hay texto
  }
}

// Función para agregar una etiqueta
function addTag(tag) {
  if (tag && !etiquetas.includes(tag)) {
    etiquetas.push(tag);
    renderTags();
  }
  inputEtiqueta.value = ''; // Limpiar el input
  showSuggestions(''); // Limpiar sugerencias
}

// Evento para capturar el texto que ingresa el usuario
inputEtiqueta.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (query) {
    showSuggestions(query);
  } else {
    contenedorConsultadas.classList.remove('active'); // Ocultar sugerencias si no hay texto
  }
});

// Evento para manejar cuando el usuario presiona la barra espaciadora
inputEtiqueta.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    const query = inputEtiqueta.value.trim();
    addTag(query);
  }
});

});
