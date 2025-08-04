// class Etiqueta {
//   constructor(
//     idEtiqueta = null,
//     nombreEtiqueta,
//     idUsuario
//   ) {
//     this.idEtiqueta = idEtiqueta;
//     this.nombreEtiqueta = nombreEtiqueta;
//     this.idUsuario = idUsuario;
//   }

//   validar(){
//     const errores=[];

//     if(!this.nombreEtiqueta|| this.nombreEtiqueta.trim()===''){
//       errores.push({campo:'nombreEtiqueta',mensaje:'El nombre de la etiqueta es obligatorio'});
//     }

//     if(!this.idUsuario){
//       errores.push({campo:'idUsuario',mensaje:"Falta el id del usuario en la etiqueta"})
//     }

//     if(errores.length>0){
//       throw new Error(JSON.stringify(errores));
//     }
//   }
// }


class Etiqueta {
  constructor({
    idEtiqueta = null,
    nombreEtiqueta,
    descripcion,
    existente = false,
    eliminar = false,
    idUsuario,
    idTareaEtiqueta = null, 
  }) {
    this.idEtiqueta = idEtiqueta;
    this.nombreEtiqueta = nombreEtiqueta;
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
    if ( this.nombreEtiqueta.trim() === '') {
      errores.push({ campo: 'nombreEtiqueta', mensaje: 'El nombre de la etiqueta es obligatorio y debe ser texto' });
    } else if (this.nombreEtiqueta.length > 30) {
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
      nombreEtiqueta: this.nombreEtiqueta,
      descripcion: this.descripcion,
      existente: this.existente,
      eliminar: this.eliminar,
      idUsuario: this.idUsuario,
      idTareaEtiqueta: this.idTareaEtiqueta,
    };
  }
}

 module.exports = Etiqueta;