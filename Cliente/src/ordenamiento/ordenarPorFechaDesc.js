import {StrategyOrdenamiento} from "./strategyOrdenamiento.js";

export class OrdenarPorFechaDesc extends StrategyOrdenamiento{

     ordenar(tareas){
         return [...tareas].sort((a, b) => {
          return a.fechaProgramada == null ? 1 : 
             b.fechaProgramada == null ? -1 :
             convertirFecha(b.fechaProgramada) - convertirFecha(a.fechaProgramada);
    });
    }
}