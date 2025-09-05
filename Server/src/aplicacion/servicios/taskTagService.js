const BaseDatabaseHandler = require('../../infraestructura/config/BaseDatabaseHandler');

class TaskTagService extends BaseDatabaseHandler {
  constructor({taskTagDAO, connectionDB}) {
    super(connectionDB);
    this.taskTagDAO = taskTagDAO;
  }

  async guardarTareaEtiqueta(idTarea, idEtiqueta, externalConn = null) {
      return this.withTransaction(async (connection) => {
      const idRelacion = await this.taskTagDAO.agregarTareaEtiqueta(idTarea, idEtiqueta, connection);
      console.log(`Relación agregada: Tarea ${idTarea} ↔ Etiqueta ${idEtiqueta}`);
        
      return idRelacion;
         },externalConn);
  }

  async eliminarTodasPorIdTarea(idTarea, externalConn = null) {
    
       return this.withTransaction(async (connection) => {
      const eliminadas = await this.taskTagDAO.eliminarTareaEtiquetasPorIdTarea(idTarea, connection);
      console.log(`Relaciones eliminadas para tarea ${idTarea}: ${eliminadas}`);
      return eliminadas;
    }, externalConn);
  }

  async obtenerPorIdTarea(idTarea, externalConn=null) {
       return this.withTransaction(async (connection) => {
      const tarea = await this.taskTagDAO.consultarTareaEtiquetaPorIdTarea(idTarea, connection);
    
       return tarea;
    },externalConn);
  }

  async eliminarPorIdTareaEtiqueta(idTareaEtiqueta, externalConn = null) {
      return this.withTransaction(async (connection) => {
      const result = await this.taskTagDAO.eliminarTareaEtiqueta(idTareaEtiqueta, connection);
      return result;
    },externalConn);
  }
}

module.exports = TaskTagService;
