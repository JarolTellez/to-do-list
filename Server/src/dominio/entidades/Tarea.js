// class Tarea{
//     constructor(idTarea=null,nombre,descripcion,fechaProgramada=null,fechaCreacion=null,fechaUltimaActualizacion=null,completada=false,idUsuario,prioridad=null){
//         this.idTarea=idTarea;
//         this.nombre=nombre;
//         this.descripcion=descripcion;
//         this.fechaProgramada=fechaProgramada;
//         this.fechaCreacion=fechaCreacion;
//         this.completada=completada;
//         this.fechaUltimaActualizacion=fechaUltimaActualizacion;
//         this.idUsuario=idUsuario;
//         this.prioridad=prioridad;
//         this.etiquetas = [];
//     }

//     validar() {
//         const errores = [];
    
//         // Validar campos obligatorios
//         if (!this.nombre || this.nombre.trim() === '') {
//           errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
//         }
    
//         if (this.descripcion.length>255) {
//           errores.push({ campo: 'descripción', mensaje: 'La descripción no puede exceder los 255 caracteres' });
//         }
    
//         if (!this.idUsuario) {
//           errores.push({ campo: 'idUsuario', mensaje: 'El ID de usuario es obligatorio' });
//         }
    
//         // Validar longitud máxima del nombre
//         if (this.nombre.length > 50) {
//           errores.push({ campo: 'nombre', mensaje: 'El título no puede exceder los 50 caracteres' });
//         }
    
//         // Validar fecha programada no sea en el pasado
//         if (this.fechaProgramada && this.fechaProgramada < new Date()) {
//           errores.push({ campo: 'fechaProgramada', mensaje: 'La fecha programada no puede ser en el pasado' });
//         }
    
    
//         if (errores.length > 0) {
//           throw new Error(JSON.stringify(errores)); 
//         }
//       }
// }


class Tarea{
    constructor({idTarea=null,nombre,descripcion,fechaProgramada=null,fechaCreacion=null,fechaUltimaActualizacion=null,completada=false,idUsuario,prioridad=null, etiquetas=[]}){
        this.idTarea=idTarea;
        this.nombre=nombre;
        this.descripcion=descripcion;
        this.fechaProgramada=fechaProgramada;
        this.fechaCreacion=fechaCreacion;
        this.fechaUltimaActualizacion=fechaUltimaActualizacion;
        this.completada=completada;
        this.idUsuario=idUsuario;
        this.prioridad=prioridad;
        this.etiquetas = etiquetas;
    }

  validar() {
    const errores = [];
  
    // Validación mejorada pero con los mismos campos
    if (typeof this.nombre !== 'string' || this.nombre.trim() === '') {
      errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio y debe ser texto' });
    } else if (this.nombre.length > 50) {
      errores.push({ campo: 'nombre', mensaje: 'El título no puede exceder los 50 caracteres' });
    }
    
    if (typeof this.descripcion !== 'string' && this.descripcion !== undefined && this.descripcion !== null) {
      errores.push({ campo: 'descripcion', mensaje: 'La descripción debe ser texto' });
    } else if (this.descripcion && this.descripcion.length > 255) {
      errores.push({ campo: 'descripcion', mensaje: 'La descripción no puede exceder los 255 caracteres' });
    }
    
    // if (!this.idUsuario) {
    //   errores.push({ campo: 'idUsuario', mensaje: 'El ID de usuario es obligatorio' });
    // }
    
    //AGREGAR LO DE TAREAS VENCIDAS
    // if ((this.fechaProgramada && new Date(this.fechaProgramada) < new Date())&& this.completada==true) {
    //   errores.push({ campo: 'fechaProgramada', mensaje: 'La fecha programada no puede ser en el pasado' });
    // }
    
    if (errores.length > 0) {
      throw new Error(JSON.stringify({
        tipoError: 'VALIDACION_TAREA',
        errores
      }));
    }
  }
  
  // Métodos para manejar etiquetas (sin modificar atributos)
  agregarEtiqueta(etiqueta) {
    if (!(etiqueta instanceof Etiqueta)) {
      throw new Error('Debe proporcionar una instancia de Etiqueta');
    }
    if (etiqueta.idUsuario !== this.idUsuario) {
      throw new Error('La etiqueta no pertenece al mismo usuario');
    }
    if (!this.etiquetas.some(e => e.idEtiqueta === etiqueta.idEtiqueta)) {
      this.etiquetas.push(etiqueta);
      this.fechaUltimaActualizacion = new Date();
    }
  }
  
  eliminarEtiqueta(idEtiqueta) {
    this.etiquetas = this.etiquetas.filter(e => e.idEtiqueta !== idEtiqueta);
    this.fechaUltimaActualizacion = new Date();
  }
  
  tieneEtiqueta(idEtiqueta) {
    return this.etiquetas.some(e => e.idEtiqueta === idEtiqueta);
  }
  
  toJSON() {
    return {
      idTarea: this.idTarea,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaProgramada: this.fechaProgramada,
      fechaCreacion: this.fechaCreacion,
      fechaUltimaActualizacion: this.fechaUltimaActualizacion,
      completada: this.completada,
      idUsuario: this.idUsuario,
      prioridad: this.prioridad,
      etiquetas: this.etiquetas.map(e => e.toJSON())
    };
  }
}

 module.exports=Tarea;