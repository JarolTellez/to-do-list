class ServicioTarea {
  constructor(tareaDAO, servicioEtiqueta, servicioTareaEtiqueta) {
    this.tareaDAO = tareaDAO;
    this.servicioTareaEtiqueta = servicioTareaEtiqueta;
    this.servicioEtiqueta = servicioEtiqueta;
  }

  async agregarTarea(tarea) {
    try {
      const tareaAgregada = await this.tareaDAO.agregarTarea(tarea);

      if (Array.isArray(tarea.etiquetas)) {
        for (const etiqueta of tarea.etiquetas) {
          //   console.log("AGREGAR: ", etiqueta.nombreEtiqueta);
          let idEtiqueta;

          if (etiqueta.idEtiqueta) {
            idEtiqueta = etiqueta.idEtiqueta;
          } else {
            const etiquetaGuardada =
              await this.servicioEtiqueta.agregarEtiqueta(etiqueta);
            idEtiqueta = etiquetaGuardada.idEtiqueta;
          }

          await this.servicioTareaEtiqueta.guardarTareaEtiqueta(
            tareaAgregada.idTarea,
            idEtiqueta
          );
        }
      }

      return tareaAgregada;
    } catch (error) {
      console.error("Error al agregar tarea:", error);
      throw new Error("No se pudo agregar la tarea");
    }
  }

  async actualizarTarea(tarea) {
    console.log("ACTUALIZAR TAREA DESDE SERVICIO TAREA: ", tarea);

    const tareaExistente = await this.tareaDAO.consultarTareaPorId(
      tarea.idTarea
    );
    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con el id: ${tarea.idTarea}.`);
    }

    // 1. Actualizar información principal de la tarea
    await this.tareaDAO.actualizarTarea(tarea);

    // 2. Procesar etiquetas
    for (const etiqueta of tarea.etiquetas) {
      console.log("ETIQUETA EN SERVICIO TAREA: ", etiqueta);

      // 2.1 Eliminar relación si es necesario
      if (etiqueta.eliminar === true && etiqueta.idTareaEtiqueta) {
        console.log("ENTRO A ELIMINAR ETIQUETA");
        await this.servicioTareaEtiqueta.eliminarPorIdTareaEtiqueta(
          etiqueta.idTareaEtiqueta
        );
        continue;
      }

      // 2.2 Crear nueva etiqueta si no existe
      if (!etiqueta.existente) {
        const etiquetaCreada = await this.servicioEtiqueta.agregarEtiqueta(
          etiqueta
        );

        if (etiquetaCreada && etiquetaCreada.idEtiqueta) {
          await this.servicioTareaEtiqueta.guardarTareaEtiqueta(
            tarea.idTarea,
            etiquetaCreada.idEtiqueta
          );
        } else {
          throw new Error(
            "No se pudo obtener el id de la nueva etiqueta creada."
          );
        }
      } else if (!etiqueta.idTareaEtiqueta) {
        // 2.3 Si la etiqueta ya existe pero no está relacionada, se crea la relación
        await this.servicioTareaEtiqueta.guardarTareaEtiqueta(
          tarea.idTarea,
          etiqueta.idEtiqueta
        );
      }
    }

    // 3. Consultar y retornar tarea actualizada
    const tareaActualizadaConsulta =
      await this.tareaDAO.consultarTareasPorIdTarea(tarea.idTarea);
    console.log("TAREA FINAL ACTUALIZAR: ", tareaActualizadaConsulta);
    return tareaActualizadaConsulta;
  }

  async eliminarTarea(idTarea, idUsuario) {
    const tareaExistente = await this.tareaDAO.consultarTareaPorIdTareaUsuario(
      idTarea,
      idUsuario
    );

    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con id ${idTarea}`);
    }

    await this.servicioTareaEtiqueta.eliminarTodasPorIdTarea(idTarea);
    const eliminada = await this.tareaDAO.eliminarTarea(idTarea);

    if (eliminada <= 0) {
      throw new Error("No se pudo eliminar la tarea");
    }
  }

  async actualizarTareaCompletada(idTarea, completada) {
    const tareaExistente = await this.tareaDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con el id: ${idTarea}.`);
    }

    const respuesta = await this.tareaDAO.actualizarTareaCompletada(
      idTarea,
      completada
    );
    if (respuesta <= 0) {
      throw new Error("No se pudo actualizar la tarea");
    }

    return await this.tareaDAO.consultarTareaPorId(idTarea);
  }

  async obtenerTareasPorIdUsuario(idUsuario) {
    const tareasPendientes =
      await this.tareaDAO.consultarTareasPendientesPorIdUsuario(idUsuario);
    const tareasCompletadas =
      await this.tareaDAO.consultarTareasCompletadasUsuario(idUsuario);

    return { tareasPendientes, tareasCompletadas };
  }
}

module.exports = ServicioTarea;
