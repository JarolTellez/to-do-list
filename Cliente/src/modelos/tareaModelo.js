export class Tarea {
  constructor(
    idTarea = null,
    nombre,
    descripcion,
    fechaProgramada = null,
    fechaCreacion = null,
    fechaUltimaActualizacion = null,
    completada = false,
    idUsuario,
    prioridad = null,
    etiquetas = []
  ) {
    this.idTarea = idTarea;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.fechaProgramada = fechaProgramada ? new Date(fechaProgramada) : null;
    this.fechaCreacion = fechaCreacion ? new Date(fechaCreacion) : null;
    this.fechaUltimaActualizacion = fechaUltimaActualizacion ? new Date(fechaUltimaActualizacion) : null;
    this.completada = completada;
    this.idUsuario = idUsuario;
    this.prioridad = prioridad;
    this.etiquetas = etiquetas;
  }

  validar() {
    const errores = [];

    if (!this.nombre || this.nombre.trim() === '') {
      errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
    }

    if (this.nombre && this.nombre.length > 50) {
      errores.push({ campo: 'nombre', mensaje: 'El nombre no puede superar 50 caracteres' });
    }

    if (this.descripcion && this.descripcion.length > 255) {
      errores.push({ campo: 'descripcion', mensaje: 'La descripción no puede superar 255 caracteres' });
    }

    if (!this.idUsuario) {
      errores.push({ campo: 'idUsuario', mensaje: 'El ID del usuario es obligatorio' });
    }

    if (this.fechaProgramada && this.fechaProgramada < new Date()) {
      errores.push({ campo: 'fechaProgramada', mensaje: 'La fecha no puede estar en el pasado' });
    }

    if (errores.length > 0) {
      throw errores;
    }
  }

    toJSON() {
    return {
      idTarea: this.idTarea,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaProgramada: this.fechaProgramada,
      fechaUltimaActualizacion: this.fechaUltimaActualizacion,
      completada: this.completada,
      idUsuario: this.idUsuario,
      prioridad: this.prioridad,
      etiquetas: this.etiquetas,
    };
  }
}
