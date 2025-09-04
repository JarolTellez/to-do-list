class Etiqueta {
  constructor({
    idEtiqueta = null,
    nombre,
    descripcion,
    existente = false,
    eliminar = false,
    idUsuario,
    idTareaEtiqueta = null, 
  }) {
    this.idEtiqueta = idEtiqueta;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.existente = existente;
    this.eliminar = eliminar;
    this.idUsuario = idUsuario;
    this.idTareaEtiqueta = idTareaEtiqueta;


    
    this.validar();
  }

  validar() {
    const errores = [];
    
    // Validación más robusta pero con los mismos campos
    if ( this.nombre.trim() === '') {
      errores.push({ campo: 'nombreEtiqueta', mensaje: 'El nombre de la etiqueta es obligatorio y debe ser texto' });
    } else if (this.nombre.length > 30) {
      errores.push({ campo: 'nombreEtiqueta', mensaje: 'El nombre no puede exceder 30 caracteres' });
    }
    
    if (errores.length > 0) {
      throw new Error(JSON.stringify({
        tipoError: 'VALIDACION_ETIQUETA',
        errores
      }));
    }
  }
  
  toJSON() {
    return {
      idEtiqueta: this.idEtiqueta,
      nombre: this.nombre,
      descripcion: this.descripcion,
      existente: this.existente,
      eliminar: this.eliminar,
      idUsuario: this.idUsuario,
      idTareaEtiqueta: this.idTareaEtiqueta,
    };
  }
}

 module.exports = Etiqueta;