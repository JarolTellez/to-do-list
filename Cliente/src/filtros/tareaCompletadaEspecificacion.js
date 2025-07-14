class TareaCompletadaEspecificacion  extends Especificacion{

    cumple(tarea){
        return tarea.completada === true;
    }
}