const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class ServicioTarea extends BaseDatabaseHandler {
  constructor(tareaDAO, servicioEtiqueta, servicioTareaEtiqueta, conexionBD) {
    super(conexionBD);
    this.tareaDAO = tareaDAO;
    this.servicioTareaEtiqueta = servicioTareaEtiqueta;
    this.servicioEtiqueta = servicioEtiqueta;
  }

  async agregarTarea(tarea, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tareaAgregada = await this.tareaDAO.agregarTarea(tarea, connection);

      if (Array.isArray(tarea.etiquetas)) {
        for (const etiqueta of tarea.etiquetas) {
          //   console.log("AGREGAR: ", etiqueta.nombreEtiqueta);
          let idEtiqueta;

          if (etiqueta.idEtiqueta) {
            idEtiqueta = etiqueta.idEtiqueta;
          } else {
            const etiquetaGuardada =
              await this.servicioEtiqueta.agregarEtiqueta(etiqueta, connection);
            idEtiqueta = etiquetaGuardada.idEtiqueta;
          }

          await this.servicioTareaEtiqueta.guardarTareaEtiqueta(
            tareaAgregada.idTarea,
            idEtiqueta,
            connection
          );
        }
      }

    //   //  forzar rollback
    // throw new Error("Error simulado para probar transacciones");
    
      return tareaAgregada;
    }, externalConn);
  }

  async actualizarTarea(tarea, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tareaExistente = await this.tareaDAO.consultarTareaPorId(
        tarea.idTarea,
        connection
      );
      if (!tareaExistente) {
        throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
      }

      // Actualizar información principal de la tarea
      await this.tareaDAO.actualizarTarea(tarea, connection);

      // Procesar etiquetas
      for (const etiqueta of tarea.etiquetas) {
        console.log("ETIQUETA EN SERVICIO TAREA: ", etiqueta);

        //Eliminar relación si es necesario
        if (etiqueta.eliminar === true && etiqueta.idTareaEtiqueta) {
          console.log("ENTRO A ELIMINAR ETIQUETA");
          await this.servicioTareaEtiqueta.eliminarPorIdTareaEtiqueta(
            etiqueta.idTareaEtiqueta,
            connection
          );
          continue;
        }

        //Crear nueva etiqueta si no existe
        if (!etiqueta.existente) {
          const etiquetaCreada = await this.servicioEtiqueta.agregarEtiqueta(
            etiqueta,
            connection
          );

          if (etiquetaCreada && etiquetaCreada.idEtiqueta) {
            await this.servicioTareaEtiqueta.guardarTareaEtiqueta(
              tarea.idTarea,
              etiquetaCreada.idEtiqueta,
              connection
            );
          } else {
            throw new Error(
              "No se pudo obtener el id de la nueva etiqueta creada."
            );
          }
        } else if (!etiqueta.idTareaEtiqueta) {
          // Si la etiqueta ya existe pero no está relacionada, se crea la relación
          await this.servicioTareaEtiqueta.guardarTareaEtiqueta(
            tarea.idTarea,
            etiqueta.idEtiqueta,
            connection
          );
        }
      }

      //  Consultar y retornar tarea actualizada
      const tareaActualizadaConsulta =
        await this.tareaDAO.consultarTareasPorIdTarea(
          tarea.idTarea,
          connection
        );
      console.log("TAREA FINAL ACTUALIZAR: ", tareaActualizadaConsulta);
      return tareaActualizadaConsulta;
    }, externalConn);
  }

  async eliminarTarea(idTarea, idUsuario, externalConn = null) {
      return this.withTransaction(async (connection) => {
      const tareaExistente =
        await this.tareaDAO.consultarTareaPorIdTareaUsuario(
          idTarea,
          idUsuario,
          connection
        );

      if (!tareaExistente) {
        throw new Error(`No se encontró la tarea con id ${idTarea}`);
      }

      await this.servicioTareaEtiqueta.eliminarTodasPorIdTarea(idTarea, connection);
      const eliminada = await this.tareaDAO.eliminarTarea(idTarea, connection);

      if (eliminada <= 0) {
        throw new Error("No se pudo eliminar la tarea");
      }

      },externalConn);
  }

  async actualizarTareaCompletada(idTarea, completada, externalConn = null) {
       return this.withTransaction(async (connection) => {
      const tareaExistente = await this.tareaDAO.consultarTareaPorId(
        idTarea,
        connection
      );
      if (!tareaExistente) {
        throw new Error(`No se encontró la tarea con el id: ${idTarea}.`);
      }

      const respuesta = await this.tareaDAO.actualizarTareaCompletada(
        idTarea,
        completada,
        connection
      );
      if (respuesta <= 0) {
        throw new Error("No se pudo actualizar la tarea");
      }

      const tareaActualizada = await this.tareaDAO.consultarTareaPorId(idTarea, connection);
 
      return tareaActualizada;
    }, externalConn);
  }

  async obtenerTareasPorIdUsuario(idUsuario, externalConn = null) {
       return this.withTransaction(async (connection) => {
      const tareasPendientes =
        await this.tareaDAO.consultarTareasPendientesPorIdUsuario(
          idUsuario,
          connection
        );
      const tareasCompletadas =
        await this.tareaDAO.consultarTareasCompletadasUsuario(
          idUsuario,
          connection
        );

   
      return { tareasPendientes, tareasCompletadas };
    }, externalConn);
  }
}

module.exports = ServicioTarea;
