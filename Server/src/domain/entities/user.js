const { error } = require('winston');

class User{
    constructor({id=null, userName, email, password, rol='usuario'}) {
        this.id = id;
        this.userName = userName;
        this.email = email;
        this.password = password;
        this.rol = rol;
      }

      validate(){
        const errors=[];

        if(!this.userName||this.userName.trim()===''){
          errors.push({field:'userName', message:'El nombre del usuario es obligatorio'});
        }

        if(!this.email||this.email.trim()===''){
          errors.push({field:'email', message:'El email del usuario es obligatorio'});
        }

        if(!this.password||this.password.trim()===''){
          errors.push({field:'password', message:'La password del usuario es obligatoria'});
        }

        if(errors.length>0){
          throw new Error(JSON.stringify(errors));
        }
      }
}

module.exports=User;

