export class Etiqueta {
  constructor(idEtiqueta = null, nombreEtiqueta, descripcion, existente = false, eliminar=false, idUsuario, idTareaEtiqueta=null,) {
    this.idEtiqueta = idEtiqueta;
    this.nombreEtiqueta=nombreEtiqueta
    this.descripcion = descripcion;
    this.existente = existente;
    this.eliminar = eliminar;
    this.idUsuario = idUsuario;
    this.idTareaEtiqueta = idTareaEtiqueta;
  }

  validar() {
    const errores = [];

    if (!this.nombreEtiqueta || this.nombreEtiqueta.trim() === '') {
      errores.push({ campo: 'nombreEtiqueta', mensaje: 'El nombre de la etiqueta es obligatorio' });
    }

    if (!this.idUsuario) {
      errores.push({ campo: 'idUsuario', mensaje: 'Falta el ID del usuario' });
    }

    if (errores.length > 0) {
      throw errores;
    }
  }
}
