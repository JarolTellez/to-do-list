class AndEspecificacion{
    constructor(izquierda, derecha){
        super();
        this.izquierda=izquierda;
        this.derecha=derecha;
    }

      cumple(tarea){
      return this.izquierda.cumple(tarea) && this.derecha.cumple(tarea);
    }
}