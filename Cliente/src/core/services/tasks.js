import {mapApiToTarea} from "../../mappers/taskMapper.js";
import{api} from "../utils/apiClient.js";

export async function createTask(newTask) {
  
  try {
    const response = await api.post("/tarea/", newTask);
    const mappedTask = mapApiToTarea(response.data);
    
 
    return mappedTask;
    
  } catch (error) {
    console.error("Error al agregar la tarea:", error);
    throw error;
  }
}

export async function findAllTasksByUserId(userId) {
  try {
    const response = await api.post("/tarea/consultar", { userId: userId });
   console.log("data", response.data);
    const pendingTasks= response.data.pendingTasks.tasks.map(mapApiToTarea);
    const completedTasks= response.data.completedTasks.tasks.map(mapApiToTarea);

    
    return { pendingTasks, completedTasks};
    
  } catch (error) {
    console.error("Error en findAllTasksByUserId:", error);
    throw error;
  }
}

export async function completeTask(taskId,isCompleted, userId) {
  try {
    const response = await api.patch("/tarea/gestionar", {
      taskId: taskId, 
      isCompleted: isCompleted,
      userId: userId,
      
    });

    return response.data;
    
  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }
}


export async function updateTask(tareaActualizada){
  try {
    const response= await api.patch("/tarea/actualizar", tareaActualizada);
    return response.data;

  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }

}

export async function deleteTask(taskId,userId) {
  try {
    const response=await api.post("/tarea/gestionar",{
      taskId: taskId,
      userId: userId,
    });

    return response.data;
  } catch (error) {
    throw new Error("Error al eliminar la tarea: " + error.message);
  }
  
}