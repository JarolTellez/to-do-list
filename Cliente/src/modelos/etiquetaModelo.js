export class Etiqueta {
  constructor(idEtiqueta = null, idTareaEtiqueta=null, idUsuario, nombreEtiqueta) {
    this.idEtiqueta = idEtiqueta;
    this.idTareaEtiqueta = idTareaEtiqueta;
    this.idUsuario = idUsuario;
    this.nombreEtiqueta = nombreEtiqueta;
  
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
