document.addEventListener("DOMContentLoaded", function () {
  const tituloTarea = document.querySelector(".tituloTarea");
  const descripcionTarea = document.querySelector(".descripcionTarea");
  const etiquetas = document.querySelector(".listaEtiquetas");

  const btnAgregarTarea = document.querySelector(".agregarModal");

  btnAgregarTarea.addEventListener("click", function () {
    agregarTarea();
  });

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
});
