import {Etiqueta} from "../modelos/etiquetaModelo.js";

export function mapApiToEtiqueta(apiDatos){
    return new Etiqueta(
        apiDatos.idEtiqueta,
        apiDatos.idTareaEtiqueta,
        apiDatos.idUsuario,
        apiDatos.nombreEtiqueta,
    )
}