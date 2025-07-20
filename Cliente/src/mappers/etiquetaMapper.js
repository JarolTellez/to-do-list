import { Etiqueta } from "../modelos/etiquetaModelo.js";

export function mapApiToEtiqueta(apiDatos) {
  return new Etiqueta(
    apiDatos.idEtiqueta,
    apiDatos.nombreEtiqueta,
    apiDatos.descripcion || null,
    true,
    false,
    apiDatos.idUsuario,
    apiDatos.idTareaEtiqueta
  );
}
