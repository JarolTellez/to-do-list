import{api} from "../utils/apiCliente.js";

export async function cargarEtiquetas() {
  const idUsuario = sessionStorage.getItem("idUsuario");
  console.log("ID USUARIO DESDE TAREAS: ", idUsuario);

  try {
    const response = await api.post("/etiqueta/", { idUsuario });

    const etiquetas = response.data;
    return etiquetas;
    
  } catch (error) {
    console.error("Error al cargar etiquetas:", error.message);
    alert("Error al consultar las etiquetas: " + error.message);
    return [];
  }
}