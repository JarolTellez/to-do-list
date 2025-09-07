export class FilterSort {
  constructor() {
    this.sorterStrategies = [];
    this.filtro = null;
  }

  addSorter(strategy) {
    if (strategy) {
      this.sorterStrategies.push(strategy);
    }
    return this;
  }

  setSorter(strategy) {
    this.sorterStrategies = strategy ? [strategy] : [];
    return this;
  }

  setFilter(Specification) {
    this.filtro = Specification;
    return this;
  }

  sort(tasks) {
    console.log("RECIEN LLEGADAS: ", tasks);
      let resultadoTareas = this.filtro
      ? tasks.filter((tarea) => this.filtro.satisfies(tarea))
      : [...tasks];
      
      console.log(" FILTRO APLICADO: ", resultadoTareas);

   
    if (this.sorterStrategies.length > 0) {
      for (const strategy of this.sorterStrategies.reverse()) {
       resultadoTareas = strategy.sort(resultadoTareas);
      }
    }

    return resultadoTareas;
  }

  cleanSorters() {
    this.sorterStrategies = [];
    return this;
  }
}
