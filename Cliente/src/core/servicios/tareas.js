import {mapApiToTarea} from "../../mappers/tareaMapper.js";
import{api} from "../utils/apiCliente.js";

export async function agregarTarea(tareaNueva) {
  console.log("TAREA QUE SE MANDARA A GUARDAR: ", tareaNueva);
  
  try {
    const tareaAgregada = await api.post("/tarea/", tareaNueva);
    const tareaMapeada = mapApiToTarea(tareaAgregada.data);
    
    console.log("TAREA AGREGADA: ", tareaMapeada);
    return tareaMapeada;
    
  } catch (error) {
    console.error("Error al agregar la tarea:", error);
    throw error;
  }
}

export async function consultarTareasUsuario(idUsuario) {
  try {
    const response = await api.post("/tarea/consultar", { idUsuario: idUsuario });
    
    const tareasPendientes = response.data.tareasPendientes.map(mapApiToTarea);
    const tareasCompletadas = response.data.tareasCompletadas.map(mapApiToTarea);
    
    return { tareasPendientes, tareasCompletadas };
    
  } catch (error) {
    console.error("Error en consultarTareasUsuario:", error);
    throw error;
  }
}

export async function actualizarTareaCompletada(idTarea, completada) {
  try {
    const response = await api.patch("/tarea/gestionar", {
      idTarea: idTarea, 
      completada: completada
    });

    return response.data;
    
  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }
}


export async function actualizarTarea(tareaActualizada){
  try {
    const response= await api.patch("/tarea/actualizar", tareaActualizada);
    return response.data;

  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }

}

export async function eliminarTarea(idTarea,idUsuario) {
  try {
    const response=await api.post("/tarea/gestionar",{
      idTarea: idTarea,
      idUsuario: idUsuario,
    });

    return response.data;
  } catch (error) {
    throw new Error("Error al eliminar la tarea: " + error.message);
  }
  
}