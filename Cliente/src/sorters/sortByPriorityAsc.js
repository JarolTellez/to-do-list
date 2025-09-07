import {SortStrategy} from "./sortStrategy.js";

export class SortByPriorityAsc extends SortStrategy{

     sort(tasks){
        //Utilizo sort para ordenar de mayor a menor con respecto a la prioridad, pero uso slice para crear una
    //copia del arreglo original para no modificarlo porque necesito las tasks pendientes tal cual estan y asi solo
    //modifico la copia que es el arreglo ordenado de mayor a menor por prioridad
      return [...tasks].sort((a, b) => {
      if (a.priority === null || a.priority === undefined) return 1;
      if (b.priority === null || b.priority === undefined) return -1;
      return a.priority - b.priority;
    });

    }
}