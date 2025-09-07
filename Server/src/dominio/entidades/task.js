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

  validate() {
    const errors = [];
  
    // Validación mejorada pero con los mismos campos
    if (typeof this.name !== 'string' || this.name.trim() === '') {
      errors.push({ field: 'name', message: 'El nombre es obligatorio y debe ser texto' });
    } else if (this.name.length > 50) {
      errors.push({ field: 'name', message: 'El título no puede exceder los 50 caracteres' });
    }
    
    if (typeof this.description !== 'string' && this.description !== undefined && this.description !== null) {
      errors.push({ field: 'description', message: 'La descripción debe ser texto' });
    } else if (this.description && this.description.length > 255) {
      errors.push({ field: 'description', message: 'La descripción no puede exceder los 255 caracteres' });
    }
    
    
    if (errors.length > 0) {
      throw new Error(JSON.stringify({
        tipoError: 'VALIDACION_TAREA',
        errors
      }));
    }
  }
  
  // Métodos para manejar tags (sin modificar atributos)
  addTag(tag) {
    if (!(tag instanceof Etiqueta)) {
      throw new Error('Debe proporcionar una instancia de etiqueta');
    }
    if (tag.userId !== this.userId) {
      throw new Error('La etiqueta no pertenece al mismo usuario');
    }
    if (!this.tags.some(e => e.id === tag.id)) {
      this.tags.push(tag);
      this.lastUpdateDate = new Date();
    }
  }
  
  deleteTag(id) {
    this.tags = this.tags.filter(e => e.id !== id);
    this.lastUpdateDate = new Date();
  }
  
  hasTag(id) {
    return this.tags.some(e => e.id === id);
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