class OrdenarPorPrioridadDesc extends StrategyOrdenamiento {
  ordenar(tareas) {
     const tareasOrdenadasMenorMayor = tareas.slice().sort((a, b) => {
    // Si la primer priroridad es null o undefined, mover al final
    if (a.prioridad === null || a.prioridad === undefined) return 1;
    // Si la segunda prioridad es null o undefined, mover al final
    if (b.prioridad === null || b.prioridad === undefined) return -1;

    return a.prioridad - b.prioridad;
  });

  return tareasOrdenadasMenorMayor;
  }
}
