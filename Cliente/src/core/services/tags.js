import{api} from "../utils/apiClient.js";

export async function loadTags() {
  const userId = sessionStorage.getItem("userId");

  try {
    const response = await api.post("/etiqueta/", { userId });

    const tags = response.data;
    return tags;
    
  } catch (error) {
    console.error("Error al cargar etiquetas:", error.message);
    alert("Error al consultar las etiquetas: " + error.message);
    return [];
  }
}