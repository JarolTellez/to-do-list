import {StrategyOrdenamiento} from "./strategyOrdenamiento.js";

export class OrdenarPorPrioridadAsc extends StrategyOrdenamiento{

     ordenar(tareas){
        //Utilizo sort para ordenar de mayor a menor con respecto a la prioridad, pero uso slice para crear una
    //copia del arreglo original para no modificarlo porque necesito las tareas pendientes tal cual estan y asi solo
    //modifico la copia que es el arreglo ordenado de mayor a menor por prioridad
      return [...tareas].sort((a, b) => {
      if (a.prioridad === null || a.prioridad === undefined) return 1;
      if (b.prioridad === null || b.prioridad === undefined) return -1;
      return a.prioridad - b.prioridad;
    });

    }
}