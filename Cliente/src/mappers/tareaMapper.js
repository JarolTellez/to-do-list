import {Tarea} from "../modelos/tareaModelo";
import {mapApiToEtiqueta} from "../mappers/etiquetaMapper";

export function mapApiToTarea(apiDatos){
    return new Tarea(
        apiDatos.idTarea,
        apiDatos.nombre,
        apiDatos.descripcion,
        apiDatos.fechaProgramada,
        apiDatos.fechaUltimaActualizacion,
        apiDatos.completada,
        apiDatos.idUsuario,
        apiDatos.prioridad,
        apiDatos.etiquetas.map(etiqueta => mapApiToEtiqueta(etiqueta)),

    );
}