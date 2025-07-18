const Etiqueta = require("../dominio/Etiqueta");

class EtiquetaMapper{
     dbToDomain(etiquetaId,etiquetaNombre, etiquetaIdUsuario, tareaEtiquetaId){

        return new Etiqueta(etiquetaId,etiquetaNombre,etiquetaIdUsuario, tareaEtiquetaId)
    }
}

module.exports = EtiquetaMapper;