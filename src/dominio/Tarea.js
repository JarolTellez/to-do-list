class Tarea{
    constructor(id=null,nombre,descripcion,fechaCreacion=new Date(),fechaUltimaActualizacion=new Date(),completada=false,idUsuario,prioridad=null){
        this.id=id;
        this.nombre=nombre;
        this.descripcion=descripcion;
        this.fechaCreacion=fechaCreacion;
        this.completada=completada;
        this.fechaUltimaActualizacion=fechaUltimaActualizacion;
        this.idUsuario=idUsuario;
        this.prioridad=prioridad;
    }

}

module.exports=Tarea;