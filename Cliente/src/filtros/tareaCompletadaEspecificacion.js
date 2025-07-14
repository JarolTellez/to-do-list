import { Especificacion } from './base_operadores/Especificacion.js';


class TareaCompletadaEspecificacion  extends Especificacion{

    cumple(tarea){
        return tarea.completada === true;
    }
}