
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
    if (response.ok) {
      return data; // Devuelve los datos de la tarea creada
    } else {
      throw new Error(data.mensaje);
    }
  } catch (error) {
    throw new Error("Error al agregar la tarea: " + error.message);
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
      return respuesta.data;
    }else {
      throw new Error(respuesta.mensaje);
    }
  } catch (error) {
    throw new Error("Error al consultar las tareas: " + error.message);
  }
}

export async function actualizarTareaCompletada(idTarea,completada) {
  const urlTareaCompletada="http://localhost:3000/tarea/:id/completar"

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
