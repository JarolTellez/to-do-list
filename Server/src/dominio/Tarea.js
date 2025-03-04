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

    validar() {
        const errores = [];
    
        // Validar campos obligatorios
        if (!this.nombre || this.nombre.trim() === '') {
          errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
        }
    
        if (this.descripcion.length>20) {
          errores.push({ campo: 'descripción', mensaje: 'La descripción no puede exceder los 100 caracteres' });
        }
    
        if (!this.idUsuario) {
          errores.push({ campo: 'idUsuario', mensaje: 'El ID de usuario es obligatorio' });
        }
    
        // Validar longitud máxima del nombre
        if (this.nombre.length > 100) {
          errores.push({ campo: 'nombre', mensaje: 'El nombre no puede exceder los 100 caracteres' });
        }
    
        // Validar fecha programada no sea en el pasado
        if (this.fechaProgramada && this.fechaProgramada < new Date()) {
          errores.push({ campo: 'fechaProgramada', mensaje: 'La fecha programada no puede ser en el pasado' });
        }
    
    
        if (errores.length > 0) {
          throw new Error(JSON.stringify(errores)); // Lanzar errores como JSON
        }
      }
}

module.exports=Tarea;