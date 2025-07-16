const { error } = require("winston");

class Usuario{
    constructor(idUsuario=null, nombreUsuario, correo, contrasena, rol="usuario") {
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.correo = correo;
        this.contrasena = contrasena;
        this.rol = rol;
      }

      validar(){
        const errores=[];

        if(!this.nombreUsuario||this.nombreUsuario.trim()===''){
          errores.push({campo:'nombreUsuario', mensaje:'El nombre del usuario es obligatorio'});
        }

        if(!this.correo||this.correo.trim()===''){
          errores.push({campo:'correo', mensaje:'El correo del usuario es obligatorio'});
        }

        if(!this.contrasena||this.contrasena.trim()===''){
          errores.push({campo:'contrasena', mensaje:'La contrasena del usuario es obligatoria'});
        }

        if(errores.length>0){
          throw new Error(JSON.stringify(errores));
        }
      }
}

module.exports=Usuario;

