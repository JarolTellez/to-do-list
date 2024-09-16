const EtiquetaDAO=require('../datos/EtiquetaDAO');
const Etiqueta=require('../dominio/Etiqueta');

async function agregarEtiqueta(etiqueta){
    try {
        const nuevaEtiqueta= await EtiquetaDAO.agregarEtiqueta(etiqueta);
        console.log("Nueva etiqueta guardada: ",nuevaEtiqueta);
    } catch (error) {
        console.log("Error al guardar el usuario: ",error);

    }

}




  