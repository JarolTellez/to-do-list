export async function cargarEtiquetas() {
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
  } catch (error) {
    console.log(error.message);
    alert("Error al consultar las etiquetas: ", error.message);
    return [];
  }
}
