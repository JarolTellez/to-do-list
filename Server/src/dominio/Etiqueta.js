class Etiqueta {
  constructor(
    idEtiqueta = null,
    nombreEtiqueta,
    idUsuario
  ) {
    this.idEtiqueta = idEtiqueta;
    this.nombreEtiqueta = nombreEtiqueta;
    this.idUsuario = idUsuario;
  }
}

module.exports = Etiqueta;
