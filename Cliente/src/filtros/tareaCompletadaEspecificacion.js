import { Especificacion } from './base_operadores/Especificacion.js';


export class TareaCompletadaEspecificacion  extends Especificacion{

    cumple(tarea){
        return tarea.completada === true;
    }
}