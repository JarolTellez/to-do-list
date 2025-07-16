export class Etiqueta {
  constructor(idEtiqueta = null, nombreEtiqueta, idUsuario) {
    this.idEtiqueta = idEtiqueta;
    this.nombreEtiqueta = nombreEtiqueta;
    this.idUsuario = idUsuario;
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
