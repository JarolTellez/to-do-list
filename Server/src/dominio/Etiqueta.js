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

  validar(){
    const errores=[];

    if(!this.nombreEtiqueta|| this.nombreEtiqueta.trim()===''){
      errores.push({campo:'nombreEtiqueta',mensaje:'El nombre de la etiqueta es obligatorio'});
    }

    if(!this.idUsuario){
      errores.push({campo:'idUsuario',mensaje:"Falta el id del usuario en la etiqueta"})
    }

    if(errores.length>0){
      throw new Error(JSON.stringify(errores));
    }
  }
}

module.exports = Etiqueta;
