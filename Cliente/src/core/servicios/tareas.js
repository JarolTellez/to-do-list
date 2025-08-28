import {mapApiToTarea} from "../../mappers/tareaMapper.js";

export async function agregarTarea(tareaNueva) {
  const urlTarea = "http://localhost:3000/tarea/";
console.log("TAREA QUE SE MANDARA  AGUARDAR: ",tareaNueva);
  try {
    const response = await fetch(urlTarea, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tareaNueva),
      credentials: "include"
    });

    const data = await response.json();
    const tareaAgregada = mapApiToTarea(data.data);
    console.log("TAREA AGREGADA: ", tareaAgregada);

    
    
    if (!response.ok) {
      throw data; 
    }

    // Si la respuesta es exitosa, devolver los datos
   return tareaAgregada;
  } catch (error) {
   
    console.error("Error al agregar la tarea:", error);

    throw error;
   
  }
}

export async function consultarTareasUsuario(idUsuario) {
  const urlTareasUsuario = "http://localhost:3000/tarea/consultar";

  try {
    const response = await fetch(urlTareasUsuario, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idUsuario: idUsuario }),
      credentials: "include"
    });

    //AGREGAR DESPUES
    // // Manejar error 401 (Token expirado)
    // if (response.status === 401) {
    //   try {
    //     // Intentar refrescar el token
    //     await refreshToken();
    //     // Reintentar la consulta
    //     return consultarTareasUsuario(idUsuario);
    //   } catch (refreshError) {
    //     // Redirigir a login si el refresh falla
    //     window.location.href = '/login';
    //     throw new Error("Sesión expirada");
    //   }
    // }

    const respuesta = await response.json();
    
    if (response.ok) {
      const tareasPendientes = respuesta.data.tareasPendientes.map(mapApiToTarea);
      const tareasCompletadas = respuesta.data.tareasCompletadas.map(mapApiToTarea);
      
      return { tareasPendientes, tareasCompletadas };
    } else {
      throw new Error(respuesta.mensaje || "Error del servidor");
    }
  } catch (error) {
    console.error("Error en consultarTareasUsuario:", error);
    throw error;
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
      body:JSON.stringify({idTarea:idTarea,completada:completada}),
      credentials: "include"
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
      body:JSON.stringify(tareaActualizada),
      credentials: "include"
    });

    const respuesta= await response.json();

    console.log("DATOS RECIBIDOS DE LA API: ", respuesta.data);
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
      body:JSON.stringify({idTarea:idTarea,idUsuario:idUsuario}),
      credentials: "include"
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