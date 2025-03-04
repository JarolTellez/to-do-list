
export async function agregarTarea(tareaNueva) {
  const urlTarea = "http://localhost:3000/tarea/";

  try {
    const response = await fetch(urlTarea, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tareaNueva),
    });

    const data = await response.json();
    if (!response.ok) {
      // Si la respuesta no es exitosa, lanzar el error
      throw data; // data ya contiene el objeto de error del backend
    }

    // Si la respuesta es exitosa, devolver los datos
    return data;
  } catch (error) {
   
    console.error("Error al agregar la tarea:", error);

    // Relanzar el error para que pueda ser manejado por otros componentes
    throw error;
   
  }
}

export async function consultarTareasUsuario(idUsuario){
  const urlTareasUsuario="http://localhost:3000/tarea/consultar"

  try {
    const response=await fetch(urlTareasUsuario,{
      method:"POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idUsuario: idUsuario }),

    })

    const respuesta=await response.json();
    if(response.ok){
      console.log("DATA",respuesta.data.tareasPendientes);
      return respuesta.data;
    }else {
      throw new Error(respuesta.mensaje);
    }
  } catch (error) {
    throw new Error("Error al consultar las tareas: " + error.message);
  }
}

export async function actualizarTareaCompletada(idTarea,completada) {
  const urlTareaCompletada="http://localhost:3000/tarea/gestionar"

  try {
    const response=await fetch(urlTareaCompletada,{
      method:"PATCH",
      headers:{
        "Content-Type": "application/json",
      },
      body:JSON.stringify({idTarea:idTarea,completada:completada})
    });

    const respuesta=await response.json();

    if(response.ok){
      return respuesta.data;
    }else {
      throw new Error(respuesta.mensaje);
    }


  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }
  
}

export async function actualizarTarea(tareaActualizada){
 
  const urlTareaActualizar="http://localhost:3000/tarea/actualizar";

  try {
    const response= await fetch(urlTareaActualizar,{
      method:"PATCH",
      headers:{
        "Content-Type": "application/json",
      },
      body:JSON.stringify(tareaActualizada)
    });

    const respuesta= await response.json();

    if(response.ok){
      return respuesta.data;
    }else{

    }throw new Error(respuesta.mensaje);


  } catch (error) {
    throw new Error("Error al actualizar la tarea: " + error.message);
  }

}

export async function eliminarTarea(idTarea,idUsuario) {
  const urlTareaEliminar="http://localhost:3000/tarea/gestionar"

  try {
    const response=await fetch(urlTareaEliminar,{
      method:"POST",
      headers:{
        "Content-Type": "application/json",
      },
      body:JSON.stringify({idTarea:idTarea,idUsuario:idUsuario})
    });

    const respuesta=await response.json();

    if(response.ok){
      return respuesta.data;
    }else {
      throw new Error(respuesta.mensaje);
    }


  } catch (error) {
    throw new Error("Error al eliminar la tarea: " + error.message);
  }
  
}