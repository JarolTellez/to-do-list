class Task{
    constructor({id=null,name,description,scheduledDate=null, createdAt=null,lastUpdateDate=null,isCompleted=false,userId,priority=null, tags=[]}){
        this.id=id;
        this.name=name;
        this.description=description;
        this.scheduledDate=scheduledDate;
        this.createdAt=createdAt;
        this.lastUpdateDate=lastUpdateDate;
        this.isCompleted=isCompleted;
        this.userId=userId;
        this.priority=priority;
        this.tags = tags;
    }

  validar() {
    const errores = [];
  
    // Validación mejorada pero con los mismos campos
    if (typeof this.name !== 'string' || this.name.trim() === '') {
      errores.push({ campo: 'name', mensaje: 'El name es obligatorio y debe ser texto' });
    } else if (this.name.length > 50) {
      errores.push({ campo: 'name', mensaje: 'El título no puede exceder los 50 caracteres' });
    }
    
    if (typeof this.description !== 'string' && this.description !== undefined && this.description !== null) {
      errores.push({ campo: 'description', mensaje: 'La descripción debe ser texto' });
    } else if (this.description && this.description.length > 255) {
      errores.push({ campo: 'description', mensaje: 'La descripción no puede exceder los 255 caracteres' });
    }
    
    
    if (errores.length > 0) {
      throw new Error(JSON.stringify({
        tipoError: 'VALIDACION_TAREA',
        errores
      }));
    }
  }
  
  // Métodos para manejar tags (sin modificar atributos)
  agregarEtiqueta(etiqueta) {
    if (!(etiqueta instanceof Etiqueta)) {
      throw new Error('Debe proporcionar una instancia de Etiqueta');
    }
    if (etiqueta.userId !== this.userId) {
      throw new Error('La etiqueta no pertenece al mismo usuario');
    }
    if (!this.tags.some(e => e.idEtiqueta === etiqueta.idEtiqueta)) {
      this.tags.push(etiqueta);
      this.lastUpdateDate = new Date();
    }
  }
  
  eliminarEtiqueta(idEtiqueta) {
    this.tags = this.tags.filter(e => e.idEtiqueta !== idEtiqueta);
    this.lastUpdateDate = new Date();
  }
  
  tieneEtiqueta(idEtiqueta) {
    return this.tags.some(e => e.idEtiqueta === idEtiqueta);
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      scheduledDate: this.scheduledDate,
      createdAt: this.createdAt,
      lastUpdateDate: this.lastUpdateDate,
      isCompleted: this.isCompleted,
      userId: this.userId,
      priority: this.priority,
      tags: this.tags.map(e => e.toJSON())
    };
  }
}

 module.exports=Task;