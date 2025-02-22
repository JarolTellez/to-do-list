const etiquetaDAO = require("../datos/EtiquetaDAO");
const tareaEtiquetaDAO = require("../datos/TareaEtiquetaDAO");
const Etiqueta = require("../dominio/Etiqueta");
const TareaEtiqueta = require("../dominio/TareaEtiqueta");

//Agrega a etiquetas las que no estan registradas y guarda en tareaEtiqueta es decir la tabla donde se indica a que tarea corresponden las etiquetas
exports.agregarEtiquetas = async (etiquetas, idTarea, idUsuario) => {
  try{
  for (const etiqueta of etiquetas) {
    //Verifica que la etiqueta no sea de las registradas es decir que no tenga la propiedad "idEtiqueta" para guardarla y despues ya 
    //guardada enviar guardar a tarea etiqueta ya con el id de registro de la etiqueta
    if (!etiqueta.hasOwnProperty("idEtiqueta")) {
      const etiquetaNueva = new Etiqueta(null, etiqueta.nombre, idUsuario);
      const nuevaEtiqueta = await agregarEtiqueta(etiquetaNueva);
      if(nuevaEtiqueta){
      const tareaEtiqueta = new TareaEtiqueta(
        null,
        idTarea,
        nuevaEtiqueta.idEtiqueta
      );

      await agregarTareaEtiqueta(tareaEtiqueta);
    }else{
     const existente= await etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(etiqueta.nombre,etiqueta.idUsuario);
     await agregarTareaEtiqueta(existente);
    }
      //Si es de las que ya esta guardadas en la base de datos solo guarda en tarea etiqueta
    } else {
      const tareaEtiqueta = new TareaEtiqueta(
        null,
        idTarea,
        etiqueta.idEtiqueta
      );
     await agregarTareaEtiqueta(tareaEtiqueta);
    }
  }
  }catch (error) {
    console.error("Error en agregarEtiquetas: ", error);
    throw error; 
  }
};

async function agregarEtiqueta(etiqueta) {
  try {
    const existe = await etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(
      etiqueta.nombreEtiqueta,etiqueta.idUsuario
    );
    if (existe) {
      return null;
    }

    const etiquetaGuardada = await etiquetaDAO.agregarEtiqueta(etiqueta);
    console.log("Se agrego la etiqueta correctamente: ", etiquetaGuardada);
    return etiquetaGuardada;
  } catch (error) {
    console.log("Error al agregar la etiqueta: ", error);
  }
}

async function agregarTareaEtiqueta(tareaEtiqueta) {
  try {
    const TareaEtiquetaGuardada = await tareaEtiquetaDAO.agregarTareaEtiqueta(
      tareaEtiqueta
    );
    
    console.log("Se agrego la Tareaetiqueta correctamente: ", TareaEtiquetaGuardada);
    return TareaEtiquetaGuardada;
  } catch (error) {
    console.log("Error al agregar la TareaEtiqueta: ", error);
  }
}

exports.consultarEtiquetasPorIdUsuario = async (req, res) => {
  const { idUsuario } = req.body;

  try {
    const etiquetas = await etiquetaDAO.consultarEtiquetaPorIdUsuario(
      idUsuario
    );

    if (!etiquetas || etiquetas.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No se encontraron etiquetas para este usuario.",
        data: [],
      });
    }

    return res.status(200).json({
      status: "success",
      data: etiquetas,
    });
  } catch (error) {
    console.log("Error al consultar las etiquetas: ", error);
    return res.status(500).json({
      status: "error",
      message: "Error al consultar las etiquetas.",
      error: error.message,
    });
  }
};

exports.eliminarEtiquetas=async(etiquetas)=>{
  try {
    
    for (const etiqueta of etiquetas) {
      console.log("Elimando: ",etiqueta);
    const eliminado= await tareaEtiquetaDAO.eliminarTareaEtiqueta(etiqueta.idTareaEtiqueta);
 
    };
  } catch (error) {
    console.error("Error al eliminar tareaEtiqueta: ", error);
    throw error; 
  }
 
};

exports.eliminarEtiquetasPorIdTarea=async(idTarea)=>{
  try {

    const etiquetas= await tareaEtiquetaDAO.consultarTareaEtiquetaPorIdTarea(idTarea);
    if(etiquetas && etiquetas.length>0){
    const eliminado= await tareaEtiquetaDAO.eliminarTareaEtiquetaPorIdTarea(idTarea);
    return eliminado;
    }
 
  } catch (error) {
    console.error("Error al eliminar tareaEtiqueta: ", error);
    throw error; 
  }
 
};

async function obtenerEtiquetaPorNombre(nombreEtiqueta) {
  try {
    return await etiquetaDAO.consultarEtiquetaPorNombre(nombreEtiqueta);
  } catch (error) {
    console.error("Error al obtener la etiqueta por nombre: ", error);
    throw error;
  }
}
