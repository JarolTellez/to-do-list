class Tag {
  constructor({
    id = null,
    name,
    description,
    exists = false,
    toDelete = false,
    userId,
    taskTagId = null, 
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.exists = exists;
    this.toDelete = toDelete;
    this.userId = userId;
    this.taskTagId = taskTagId;


    
    this.validar();
  }

  validar() {
    const errores = [];
    
    // Validación más robusta pero con los mismos campos
    if ( this.name.trim() === '') {
      errores.push({ campo: 'nombreEtiqueta', mensaje: 'El name de la etiqueta es obligatorio y debe ser texto' });
    } else if (this.name.length > 30) {
      errores.push({ campo: 'nombreEtiqueta', mensaje: 'El name no puede exceder 30 caracteres' });
    }
    
    if (errores.length > 0) {
      throw new Error(JSON.stringify({
        tipoError: 'VALIDACION_ETIQUETA',
        errores
      }));
    }
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      exists: this.exists,
      toDelete: this.toDelete,
      userId: this.userId,
      taskTagId: this.taskTagId,
    };
  }
}

 module.exports = Tag;