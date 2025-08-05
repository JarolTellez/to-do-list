class EtiquetaDAO {

   constructor(etiquetaMapper, conexionBD) {
    this.etiquetaMapper = etiquetaMapper;
    this.conexionBD = conexionBD;
  }

   async agregarEtiqueta(etiqueta) {
    const connection = await this.conexionBD.conectar();

    try {
      const [result] = await connection.query(
        "INSERT INTO etiquetas (nombre,id_usuario) VALUES(?,?)",
        [etiqueta.nombreEtiqueta, etiqueta.idUsuario]
      );

      etiqueta.idEtiqueta = result.insertId;
      return etiqueta;
    } catch (error) {
      console.error("Error al agregar la etiqueta en EtiquetaDAO: ", error);
      throw new Error(
        `Error al guardar la etiqueta en la base de datos:  ${error}`
      );
    } finally {
      connection.release();
    }
  }

   async actualizarEtiqueta(etiqueta) {

    const connection = await this.conexionBD.conectar();
    try {
      await connection.query("UPDATE etiquetas SET nombre = ?", [
        etiqueta.nombre,
      ]);
      return etiqueta;
    } catch (error) {
      console.log("Error al actualizar etiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async eliminarEtiqueta(idEtiqueta) {
    const connection = await this.conexionBD.conectar();

    try {
      await connection.query("DELETE FROM etiquetas WHERE id_etiqueta = ?", [
        idEtiqueta,
      ]);
    } catch (error) {
      console.log("Error al eliminar la etiqueta: ", error);
      throw error;
    } finally {
      await connection.release();
    }
  }

   async consultarTodasEtiquetas() {

    const connection = await this.conexionBD.conectar();
    try {
      const [etiquetas] = await connection.query("SELECT * FROM etiquetas");
      return etiquetas;
    } catch (error) {
      console.log("Eror al consultar etiquetas: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarEtiquetaPorNombreIdUsuario(nombreEtiqueta, idUsuario) {
   

    const connection = await this.conexionBD.conectar();
    try {
      const [etiqueta] = await connection.query(
        "SELECT * FROM etiquetas WHERE nombre = ? AND id_usuario = ?",
        [nombreEtiqueta, idUsuario]
      );
      console.log("SE ENCONTRO4: ", etiqueta[0]);
      this.etiquetaMapper.db
      return etiqueta[0];
    } catch (error) {
      console.log("Error al consultar etiqueta por nombre: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarEtiquetaPorId(idEtiqueta) {

    const connection = await this.conexionBD.conectar();
    try {
      const [etiqueta] = await connection.query(
        "SELECT * FROM etiquetas WHERE id_etiqueta = ?",
        [idEtiqueta]
      );
      return etiqueta[0];
    } catch (error) {
      console.log("Error al consultar etiqueta por id: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarEtiquetaPorIdUsuario(idUsuario) {

    const connection = await this.conexionBD.conectar();
    try {
      const [etiquetas] = await connection.query(
        "SELECT * FROM etiquetas WHERE id_usuario = ?",
        [idUsuario]
      );
      const tareasMapeadas= etiquetas.map(etiqueta => this.etiquetaMapper.bdToDominio(etiqueta));
     // return etiquetas;
     return tareasMapeadas;
    } catch (error) {
      console.error("Error al consultar las etiquetas por idUsuario: ", error);
      throw new Error(
        `Error al consultar las etiquetas por idUsuario:  ${error}`
      );
    } finally {
      connection.release();
    }
  }
}

module.exports = EtiquetaDAO;
