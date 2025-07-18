import {StrategyOrdenamiento} from "./strategyOrdenamiento.js";

export class OrdenarPorFechaDesc extends StrategyOrdenamiento{

     ordenar(tareas){
     
         return [...tareas].sort((a, b) => {
          return a.fechaProgramada == null ? 1 : 
             b.fechaProgramada == null ? -1 :
             this.convertirFecha(b.fechaProgramada) - this.convertirFecha(a.fechaProgramada);
    });
    }
        //Metodo que convierte una fecha del formato MM/DD/YYYY, HH:MM:SS AM/PM a un objeto date para usar operadores
//logicos en las fechas
 convertirFecha(fechaString) {
  console.log("fecha", fechaString);
  if (!fechaString) return null; // Si la fecha es null o undefined, devuelve null

  // Si la fecha ya está en formato ISO, devolver un objeto Date directamente
  if (fechaString.includes("T")) {
    return new Date(fechaString);
  }

  // Si la fecha está en formato normal  MM/DD/YYYY, HH:MM:SS AM/PM, convertirla a formato ISO
  try {
    const [datePart, timePart] = fechaString.split(", ");
    const [month, day, year] = datePart.split("/");
    const [time, modifier] = timePart.split(" ");
    let [hours, minutes, seconds] = time.split(":");

    // Convertir horas a formato 24 horas
    if (modifier === "PM" && hours !== "12") {
      hours = parseInt(hours, 10) + 12;
    }
    if (modifier === "AM" && hours === "12") {
      hours = "00";
    }


    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds || "00").padStart(2, "0"); // Si no hay segundos agrego "00"

    // Crear la fecha en formato ISO (YYYY-MM-DDTHH:MM:SS)
    const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hours}:${minutes}:${seconds}`;
    console.log("fechaISO", fechaISO); // Para depuración

    // Devolver un objeto Date
    return new Date(fechaISO);
  } catch (error) {
    console.error("Error al convertir la fecha:", error);
    return null; // Si hay un error se devuelve null
  }
}
}