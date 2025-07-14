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

  // ordenar(tareas) {
 
  //   let tareasFiltradas = this.filtro
  //     ? tareas.filter((tarea) => this.filtro.cumple(tarea))
  //     : [...tareas];

  //   if (this.estrategiasOrdenamiento.length > 0) {
  //     for (const estrategia of this.estrategiasOrdenamiento.reverse()) {
  //       tareasFiltradas = estrategia.ordenar(tareasFiltradas);
  //     }
  //   }

  //   return tareasFiltradas;
  // }

  ordenar(tareas) {

      let resultadoTareas = this.filtro
      ? tareas.filter((tarea) => this.filtro.cumple(tarea))
      : [...tareas];

   
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
