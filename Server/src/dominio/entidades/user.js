const { error } = require('winston');

class User{
    constructor({id=null, userName, email, password, rol='usuario'}) {
        this.id = id;
        this.userName = userName;
        this.email = email;
        this.password = password;
        this.rol = rol;
      }

      validar(){
        const errores=[];

        if(!this.userName||this.userName.trim()===''){
          errores.push({campo:'userName', mensaje:'El nombre del usuario es obligatorio'});
        }

        if(!this.email||this.email.trim()===''){
          errores.push({campo:'email', mensaje:'El email del usuario es obligatorio'});
        }

        if(!this.password||this.password.trim()===''){
          errores.push({campo:'password', mensaje:'La password del usuario es obligatoria'});
        }

        if(errores.length>0){
          throw new Error(JSON.stringify(errores));
        }
      }
}

module.exports=User;

