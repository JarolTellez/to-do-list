class Usuario{
    constructor(idUsuario=null, nombreUsuario, correo, contrasena) {
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.correo = correo;
        this.contrasena = contrasena;
      }

}

module.exports=Usuario;

