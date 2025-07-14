import {StrategyOrdenamiento} from "./strategyOrdenamiento.js";

export class OrdenarPorPrioridadDesc extends StrategyOrdenamiento {
  ordenar(tareas) {
     return [...tareas].sort((a, b) => {
      if (a.prioridad === null || a.prioridad === undefined) return 1;
      if (b.prioridad === null || b.prioridad === undefined) return -1;
      return b.prioridad - a.prioridad;
    });
  }
}
