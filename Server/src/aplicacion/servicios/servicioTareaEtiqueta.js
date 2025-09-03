const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class ServicioTareaEtiqueta extends BaseDatabaseHandler {
  constructor(tareaEtiquetaDAO, conexionBD) {
    super(conexionBD);
    this.tareaEtiquetaDAO = tareaEtiquetaDAO;
  }

  async guardarTareaEtiqueta(idTarea, idEtiqueta, externalConn = null) {
      return this.withTransaction(async (connection) => {
      const idRelacion = await this.tareaEtiquetaDAO.agregarTareaEtiqueta(idTarea, idEtiqueta, connection);
      console.log(`Relación agregada: Tarea ${idTarea} ↔ Etiqueta ${idEtiqueta}`);
        
      return idRelacion;
         },externalConn);
  }

  async eliminarTodasPorIdTarea(idTarea, externalConn = null) {
    
       return this.withTransaction(async (connection) => {
      const eliminadas = await this.tareaEtiquetaDAO.eliminarTareaEtiquetasPorIdTarea(idTarea, connection);
      console.log(`Relaciones eliminadas para tarea ${idTarea}: ${eliminadas}`);
      return eliminadas;
    }, externalConn);
  }

  async obtenerPorIdTarea(idTarea, externalConn=null) {
       return this.withTransaction(async (connection) => {
      const tarea = await this.tareaEtiquetaDAO.consultarTareaEtiquetaPorIdTarea(idTarea, connection);
    
       return tarea;
    },externalConn);
  }

  async eliminarPorIdTareaEtiqueta(idTareaEtiqueta, externalConn = null) {
      return this.withTransaction(async (connection) => {
      const result = await this.tareaEtiquetaDAO.eliminarTareaEtiqueta(idTareaEtiqueta, connection);
      return result;
    },externalConn);
  }
}

module.exports = ServicioTareaEtiqueta;
