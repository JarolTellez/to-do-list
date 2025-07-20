import {Tarea} from "../modelos/tareaModelo.js";
import {mapApiToEtiqueta} from "../mappers/etiquetaMapper.js";

// export function mapApiToTarea(apiDatos){
//     console.log("LLEGA AL MAPPER: ", apiDatos);
//     return new Tarea(
//         apiDatos.idTarea,
//         apiDatos.nombre,
//         apiDatos.descripcion,
//         apiDatos.fechaProgramada,
//         apiDatos.fechaCreacion,
//         apiDatos.fechaUltimaActualizacion,
//         apiDatos.completada,
//         apiDatos.idUsuario,
//         apiDatos.prioridad,
//         apiDatos.etiquetas.map(etiqueta => mapApiToEtiqueta(etiqueta)),

//     );
// }

export function mapApiToTarea(apiDatos) {
    
  const procesarFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  };

  return new Tarea(
    apiDatos.idTarea,
    apiDatos.nombre,
    apiDatos.descripcion,
    procesarFecha(apiDatos.fechaProgramada),
    procesarFecha(apiDatos.fechaCreacion),
    procesarFecha(apiDatos.fechaUltimaActualizacion),
    apiDatos.completada,
    apiDatos.idUsuario,
    apiDatos.prioridad,
    apiDatos.etiquetas.map(etiqueta => mapApiToEtiqueta(etiqueta))
  );
}

export function mapInputToTarea(tareaInput) {
     console.log("MAPEAR INPUT: ", tareaInput);
  const procesarFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  };

  return new Tarea(
    tareaInput.idTarea,
    tareaInput.nombre,
    tareaInput.descripcion,
    procesarFecha(tareaInput.fechaProgramada),
    procesarFecha(tareaInput.fechaCreacion),
    procesarFecha(tareaInput.fechaUltimaActualizacion),
    tareaInput.completada,
    tareaInput.idUsuario,
    tareaInput.prioridad,
    tareaInput.etiquetas.map(etiqueta => mapApiToEtiqueta(etiqueta))
  );
}




