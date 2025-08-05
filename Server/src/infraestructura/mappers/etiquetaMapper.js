class EtiquetaMapper{
  constructor(Etiqueta){
    this.Etiqueta=Etiqueta;
  }
   bdToDominio(etiqueta) {
  const { id_etiqueta, nombre, descripcion, id_usuario } = etiqueta;

  return new this.Etiqueta({
    idEtiqueta: id_etiqueta,
    nombreEtiqueta: nombre,
    descripcion,
    existente: true,
    eliminar: false,
    idUsuario: id_usuario,
    idTareaEtiqueta: null
  });
}


  bdConsultaJoinToDominio(Id, nombre, descripcion, etiquetaIdUsuario, tareaEtiquetaId) {
  console.log("TIENE ID USUARIO: ", etiquetaIdUsuario);
  return new this.Etiqueta({
    idEtiqueta: Id,
    nombreEtiqueta: nombre,
    descripcion: descripcion,
    existente: true,
    eliminar: false,
    idUsuario: etiquetaIdUsuario,
    idTareaEtiqueta: tareaEtiquetaId
  });
}

  //   requestToDominio(etiquetaRequest) {
  //   return new Etiqueta(
  //     etiquetaRequest.idEtiqueta || etiquetaRequest.id_etiqueta|| null ,
  //     etiquetaRequest.nombreEtiqueta, 
  //     etiquetaRequest.descripcion || null,
  //     true,      
  //     false,   
  //     etiquetaRequest.idUsuario || etiquetaRequest.id_usuario,
  //     etiquetaRequest.idTareaEtiqueta || null
  //   );
  
  // }
// Mapea etiqueta recibida de los request del cliente a entidad de dominio del backend
   requestToDominio(etiquetaRequest) {
    return new this.Etiqueta({
      idEtiqueta: etiquetaRequest.idEtiqueta || etiquetaRequest.id_etiqueta|| null ,
      nombreEtiqueta: etiquetaRequest.nombreEtiqueta, 
      desripcion: etiquetaRequest.descripcion || null,
      existente: etiquetaRequest.existente,      
      eliminar: etiquetaRequest.eliminar,   
      idUsuario: etiquetaRequest.idUsuario || etiquetaRequest.id_usuario,
      idTareaEtiqueta: etiquetaRequest.idTareaEtiqueta || null
   });
  
  }
}

module.exports = EtiquetaMapper;