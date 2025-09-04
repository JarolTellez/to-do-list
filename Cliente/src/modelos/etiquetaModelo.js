export class Etiqueta {
  constructor(idEtiqueta = null, nombre, descripcion, existente = false, eliminar=false, idUsuario, idTareaEtiqueta=null,) {
    this.idEtiqueta = idEtiqueta;
    this.nombre=nombre
    this.descripcion = descripcion;
    this.existente = existente;
    this.eliminar = eliminar;
    this.idUsuario = idUsuario;
    this.idTareaEtiqueta = idTareaEtiqueta;
  }

  validar() {
    const errores = [];

    if (!this.nombre || this.nombre.trim() === '') {
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
