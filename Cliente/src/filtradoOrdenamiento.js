export class FiltradoOrdenamiento {
  constructor() {
    this.estrategiasOrdenamiento = [];
    this.filtro = null;
  }

  agregarOrdenamiento(estrategia) {
    if (estrategia) {
      this.estrategiasOrdenamiento.push(estrategia);
    }
    return this;
  }

  setOrdenamiento(estrategia) {
    this.estrategiasOrdenamiento = estrategia ? [estrategia] : [];
    return this;
  }

  setFiltro(especificacion) {
    this.filtro = especificacion;
    return this;
  }

  ordenar(tareas) {
    console.log("RECIEN LLEGADAS: ", tareas);
      let resultadoTareas = this.filtro
      ? tareas.filter((tarea) => this.filtro.cumple(tarea))
      : [...tareas];
      
      console.log(" FILTRO APLICADO: ", resultadoTareas);

   
    if (this.estrategiasOrdenamiento.length > 0) {
      for (const estrategia of this.estrategiasOrdenamiento.reverse()) {
       resultadoTareas = estrategia.ordenar(resultadoTareas);
      }
    }

    return resultadoTareas;
  }

  limpiarOrdenamientos() {
    this.estrategiasOrdenamiento = [];
    return this;
  }
}
