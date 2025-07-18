import { Especificacion } from './base_operadores/Especificacion.js';

export class TareaPendienteEspecificacion  extends Especificacion{

    cumple(tarea){
        
          return tarea.completada == false;
    }
}