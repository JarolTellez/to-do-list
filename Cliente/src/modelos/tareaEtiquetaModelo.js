export class TareaEtiqueta {
  constructor(idTareaEtiqueta = null, idTarea, idEtiqueta) {
    this.idTareaEtiqueta = idTareaEtiqueta;
    this.idTarea = idTarea;
    this.idEtiqueta = idEtiqueta;
  }

  validar() {
    const errores = [];

    if (!this.idTarea) {
      errores.push({ campo: 'idTarea', mensaje: 'Falta el ID de la tarea' });
    }

    if (!this.idEtiqueta) {
      errores.push({ campo: 'idEtiqueta', mensaje: 'Falta el ID de la etiqueta' });
    }

    if (errores.length > 0) {
      throw errores;
    }
  }
}
