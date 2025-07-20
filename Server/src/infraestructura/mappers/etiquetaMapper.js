const Etiqueta = require("../../dominio/entidades/Etiqueta");

class EtiquetaMapper{
    dbToDominio(etiqueta){
        const {id_etiqueta, nombre, descripcion, id_usuario}= etiqueta;

        return new Etiqueta(id_etiqueta, nombre, descripcion, true, false, id_usuario,null);

    }

   dbConsultaJoinToDominio(Id,nombre,descripcion, etiquetaIdUsuario, tareaEtiquetaId){
        
        console.log("TIENE ID USUARIO: ",etiquetaIdUsuario );
        return new Etiqueta(Id,nombre, descripcion, true, false, etiquetaIdUsuario, tareaEtiquetaId);
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

   requestToDominio(etiquetaRequest) {
    return new Etiqueta(
      etiquetaRequest.idEtiqueta || etiquetaRequest.id_etiqueta|| null ,
      etiquetaRequest.nombreEtiqueta, 
      etiquetaRequest.descripcion || null,
      etiquetaRequest.existente,      
      etiquetaRequest.eliminar,   
      etiquetaRequest.idUsuario || etiquetaRequest.id_usuario,
      etiquetaRequest.idTareaEtiqueta || null
    );
  
  }
}

module.exports = EtiquetaMapper;