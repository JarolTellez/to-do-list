import {Task} from "../models/taskModel.js";
import {mapApiToTagModel} from "./tagMapper.js";

// export function mapApiToTarea(apiData){
//     console.log("LLEGA AL MAPPER: ", apiData);
//     return new Tarea(
//         apiData.idTarea,
//         apiData.nombre,
//         apiData.descripcion,
//         apiData.scheduledDate,
//         apiData.createdAt,
//         apiData.updatedAt,
//         apiData.isCompleted,
//         apiData.userId,
//         apiData.priority,
//         apiData.tags.map(tag => mapApiToTagModel(tag)),

//     );
// }

export function mapApiToTarea(apiData) {
    
  const procesarFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  };

  return new Task(
    apiData.id,
    apiData.name,
    apiData.description,
    procesarFecha(apiData.scheduledDate),
    procesarFecha(apiData.createdAt),
    procesarFecha(apiData.updatedAt),
    apiData.isCompleted,
    apiData.userId,
    apiData.priority,
    apiData.tags.map(tag => mapApiToTagModel(tag))
  );
}

export function mapInputToTask(tareaInput) {
     console.log("MAPEAR INPUT: ", tareaInput);
  const procesarFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  };

  return new Task(
    tareaInput.id,
    tareaInput.name,
    tareaInput.description,
    procesarFecha(tareaInput.scheduledDate),
    procesarFecha(tareaInput.createdAt),
    procesarFecha(tareaInput.updatedAt),
    tareaInput.isCompleted,
    tareaInput.userId,
    tareaInput.priority,
    tareaInput.tags.map(tag => mapApiToTagModel(tag))
  );
}




