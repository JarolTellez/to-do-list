const BaseDatabaseHandler = require('../../infraestructura/config/BaseDatabaseHandler');

class TaskService extends BaseDatabaseHandler {
  constructor({tagDAO, tagService, taskTagService, connectionDB}) {
    super(connectionDB);
    this.tagDAO = tagDAO;
    this.taskTagService = taskTagService;
    this.tagService = tagService;
  }

  async agregarTarea(tarea, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tareaAgregada = await this.tagDAO.agregarTarea(tarea, connection);

      if (Array.isArray(tarea.etiquetas)) {
        for (const etiqueta of tarea.etiquetas) {
          //   console.log('AGREGAR: ', etiqueta.nombreEtiqueta);
          let idEtiqueta;

          if (etiqueta.idEtiqueta) {
            idEtiqueta = etiqueta.idEtiqueta;
          } else {
            const etiquetaGuardada =
              await this.tagService.agregarEtiqueta(etiqueta, connection);
            idEtiqueta = etiquetaGuardada.idEtiqueta;
          }

          await this.taskTagService.guardarTareaEtiqueta(
            tareaAgregada.idTarea,
            idEtiqueta,
            connection
          );
        }
      }

    //   //  forzar rollback
    // throw new Error('Error simulado para probar transacciones');
    
      return tareaAgregada;
    }, externalConn);
  }

  async actualizarTarea(tarea, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tareaExistente = await this.tagDAO.consultarTareaPorId(
        tarea.idTarea,
        connection
      );
      if (!tareaExistente) {
        throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
      }

      // Actualizar información principal de la tarea
      await this.tagDAO.actualizarTarea(tarea, connection);

      // Procesar etiquetas
      for (const etiqueta of tarea.etiquetas) {
        console.log('ETIQUETA EN SERVICIO TAREA: ', etiqueta);

        //Eliminar relación si es necesario
        if (etiqueta.eliminar === true && etiqueta.idTareaEtiqueta) {
          console.log('ENTRO A ELIMINAR ETIQUETA');
          await this.taskTagService.eliminarPorIdTareaEtiqueta(
            etiqueta.idTareaEtiqueta,
            connection
          );
          continue;
        }

        //Crear nueva etiqueta si no existe
        if (!etiqueta.existente) {
          const etiquetaCreada = await this.tagService.agregarEtiqueta(
            etiqueta,
            connection
          );

          if (etiquetaCreada && etiquetaCreada.idEtiqueta) {
            await this.taskTagService.guardarTareaEtiqueta(
              tarea.idTarea,
              etiquetaCreada.idEtiqueta,
              connection
            );
          } else {
            throw new Error(
              'No se pudo obtener el id de la nueva etiqueta creada.'
            );
          }
        } else if (!etiqueta.idTareaEtiqueta) {
          // Si la etiqueta ya existe pero no está relacionada, se crea la relación
          await this.taskTagService.guardarTareaEtiqueta(
            tarea.idTarea,
            etiqueta.idEtiqueta,
            connection
          );
        }
      }

      //  Consultar y retornar tarea actualizada
      const tareaActualizadaConsulta =
        await this.tagDAO.consultarTareasPorIdTarea(
          tarea.idTarea,
          connection
        );
      console.log('TAREA FINAL ACTUALIZAR: ', tareaActualizadaConsulta);
      return tareaActualizadaConsulta;
    }, externalConn);
  }

  async eliminarTarea(idTarea, idUsuario, externalConn = null) {
      return this.withTransaction(async (connection) => {
      const tareaExistente =
        await this.tagDAO.consultarTareaPorIdTareaUsuario(
          idTarea,
          idUsuario,
          connection
        );

      if (!tareaExistente) {
        throw new Error(`No se encontró la tarea con id ${idTarea}`);
      }

      await this.taskTagService.eliminarTodasPorIdTarea(idTarea, connection);
      const eliminada = await this.tagDAO.eliminarTarea(idTarea, connection);

      if (eliminada <= 0) {
        throw new Error('No se pudo eliminar la tarea');
      }

      },externalConn);
  }

  async actualizarTareaCompletada(idTarea, completada, externalConn = null) {
       return this.withTransaction(async (connection) => {
      const tareaExistente = await this.tagDAO.consultarTareaPorId(
        idTarea,
        connection
      );
      if (!tareaExistente) {
        throw new Error(`No se encontró la tarea con el id: ${idTarea}.`);
      }

      const respuesta = await this.tagDAO.actualizarTareaCompletada(
        idTarea,
        completada,
        connection
      );
      if (respuesta <= 0) {
        throw new Error('No se pudo actualizar la tarea');
      }

      const tareaActualizada = await this.tagDAO.consultarTareaPorId(idTarea, connection);
 
      return tareaActualizada;
    }, externalConn);
  }

  async obtenerTareasPorIdUsuario(idUsuario, externalConn = null) {
       return this.withTransaction(async (connection) => {
      const tareasPendientes =
        await this.tagDAO.consultarTareasPendientesPorIdUsuario(
          idUsuario,
          connection
        );
      const tareasCompletadas =
        await this.tagDAO.consultarTareasCompletadasUsuario(
          idUsuario,
          connection
        );

   
      return { tareasPendientes, tareasCompletadas };
    }, externalConn);
  }
}

module.exports = TaskService;
