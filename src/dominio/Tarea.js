class Tarea{
    constructor(id=null,nombre,descripcion,fechaCreacion=new Date(),completada=false,fechaUltimaActualizacion=new Date()){
        this.id=id;
        this.nombre=nombre;
        this.descripcion=descripcion;
        this.fechaCreacion=fechaCreacion;
        this.completada=completada;
        this.fechaUltimaActualizacion=fechaUltimaActualizacion;
    }
}