 import { Especificacion } from "./Especificacion.js";

export class AndEspecificacion extends Especificacion{ 
    constructor(izquierda, derecha){
        super();
        this.izquierda=izquierda;
        this.derecha=derecha;
    }

      cumple(tarea){
      return this.izquierda.cumple(tarea) && this.derecha.cumple(tarea);
    }
}