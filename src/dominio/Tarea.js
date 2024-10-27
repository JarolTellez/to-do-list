class Tarea{
    constructor(idTarea=null,nombre,descripcion,fechaProgramada=null,fechaCreacion=null,fechaUltimaActualizacion=null,completada=false,idUsuario,prioridad=null){
        this.idTarea=idTarea;
        this.nombre=nombre;
        this.descripcion=descripcion;
        this.fechaProgramada=fechaProgramada;
        this.fechaCreacion=fechaCreacion;
        this.completada=completada;
        this.fechaUltimaActualizacion=fechaUltimaActualizacion;
        this.idUsuario=idUsuario;
        this.prioridad=prioridad;
        this.etiquetas = [];
    }

}

module.exports=Tarea;