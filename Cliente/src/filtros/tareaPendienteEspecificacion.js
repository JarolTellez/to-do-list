class TareaPendienteEspecificacion  extends Especificacion{

    cumple(tarea){
          return tarea.completada === false;
    }
}