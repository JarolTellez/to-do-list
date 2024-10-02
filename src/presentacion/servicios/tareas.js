
export async function agregarTarea(tareaNueva) {
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
    if (response.ok) {
      return data; // Devuelve los datos de la tarea creada
    } else {
      throw new Error(data.mensaje);
    }
  } catch (error) {
    throw new Error("Error al agregar la tarea: " + error.message);
  }
}
