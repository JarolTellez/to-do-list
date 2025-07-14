 export class FiltradoOrdenamiento {
  constructor() {
    this.strategy = null;
    this.filtro = null;
  }

  setOrdenamiento(strategy) {
    this.strategy = strategy;
    return this;
  }

  setFiltro(especificacion) {
    this.filtro = especificacion;
    return this;
  }

  ordenar(tareas) {
    let tareasFiltradas = tareas;

    // Aplicar filtro si existe
    if (this.filtro) {
      tareasFiltradas = tareas.filter((tarea) => this.filtro.cumple(tarea));
    }

    // Aplicar ordenamiento si existe
    if (this.strategy) {
      return this.strategy.ordenar(tareasFiltradas);
    }

    return tareasFiltradas;
  }
}
