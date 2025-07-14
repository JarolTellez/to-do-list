import { Especificacion } from './base_operadores/Especificacion.js';


export class TareaParaHoyEspecificacion extends Especificacion {
  cumple(tarea) {
    if (!tarea.fechaProgramada) return false;

    const fechaActual = new Date();
    const fechaSeparadaDeHora = tarea.fechaProgramada.split(",");
    const fechaSeparada = fechaSeparadaDeHora[0].split("/");

    const fechaDate = new Date(
      fechaSeparada[2],
      fechaSeparada[0] - 1,
      fechaSeparada[1]
    );

    return fechaActual.toDateString() === fechaDate.toDateString();
  }
}
