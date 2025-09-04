import { Etiqueta } from "../modelos/etiquetaModelo.js";

export function mapApiToEtiqueta(apiDatos) {
  return new Etiqueta(
    apiDatos.idEtiqueta,
    apiDatos.nombre,
    apiDatos.descripcion || null,
    true,
    false,
    apiDatos.idUsuario,
    apiDatos.idTareaEtiqueta
  );
}
