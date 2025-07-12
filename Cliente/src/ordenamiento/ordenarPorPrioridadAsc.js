class OrdenarPorPrioridadAsc extends StrategyOrdenamiento{

     ordenar(tareas){
        //Utilizo sort para ordenar de mayor a menor con respecto a la prioridad, pero uso slice para crear una
    //copia del arreglo original para no modificarlo porque necesito las tareas pendientes tal cual estan y asi solo
    //modifico la copia que es el arreglo ordenado de mayor a menor por prioridad
    const tareasPendientesPrioridadMayor = tareas.slice().sort((a, b) => {
      // Si la primer priroridad es null o undefined, mover al final
      if (a.prioridad === null || a.prioridad === undefined) return 1;
      // Si la segunda prioridad es null o undefined, mover al final
      if (b.prioridad === null || b.prioridad === undefined) return -1;

      return b.prioridad - a.prioridad;
    });

    return tareasPendientesPrioridadMayor;
  
    }
}