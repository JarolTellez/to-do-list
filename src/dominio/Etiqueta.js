class Etiqueta {
  constructor(
    idEtiqueta = null,
    nombreEtiqueta,
    descripcionEtiqueta,
    idUsuario
  ) {
    this.idEtiqueta = idEtiqueta;
    this.nombreEtiqueta = nombreEtiqueta;
    this.descripcionEtiqueta = descripcionEtiqueta;
    this.idUsuario = idUsuario;
  }
}

module.exports = Etiqueta;
