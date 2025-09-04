class EtiquetaMapper{
  constructor(Etiqueta){
    this.Etiqueta=Etiqueta;
  }
   bdToDominio(etiqueta) {
  const { id_etiqueta, nombre, descripcion, id_usuario } = etiqueta;

  return new this.Etiqueta({
    idEtiqueta: id_etiqueta,
    nombre: nombre,
    descripcion,
    existente: true,
    eliminar: false,
    idUsuario: id_usuario,
    idTareaEtiqueta: null
  });
}


  bdConsultaJoinToDominio(Id, nombre, descripcion, etiquetaIdUsuario, tareaEtiquetaId) {
//  console.log("TIENE ID USUARIO: ", etiquetaIdUsuario);
  return new this.Etiqueta({
    idEtiqueta: Id,
    nombre: nombre,
    descripcion: descripcion,
    existente: true,
    eliminar: false,
    idUsuario: etiquetaIdUsuario,
    idTareaEtiqueta: tareaEtiquetaId
  });
}

// Mapea etiqueta recibida de los request del cliente a entidad de dominio del backend
   requestToDominio(etiquetaRequest, idUsuario=null) {
    return new this.Etiqueta({
      idEtiqueta: etiquetaRequest.idEtiqueta || etiquetaRequest.id_etiqueta|| null ,
      nombre: etiquetaRequest.nombre, 
      desripcion: etiquetaRequest.descripcion || null,
      existente: etiquetaRequest.existente,      
      eliminar: etiquetaRequest.eliminar,   
      idUsuario: etiquetaRequest.idUsuario || idUsuario,
      idTareaEtiqueta: etiquetaRequest.idTareaEtiqueta || null
   });
  
  }

 
}

module.exports = EtiquetaMapper;