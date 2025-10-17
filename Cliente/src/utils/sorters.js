class SortStrategy {
  sort(tasks) {
    throw new Error("Método sort() debe ser implementado");
  }

  getDescription() {
    return this.constructor.name;
  }
}


export class SortByPriorityAsc extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      const priorityA = a.priority === null || a.priority === undefined || a.priority === 0 ? -1 : a.priority;
      const priorityB = b.priority === null || b.priority === undefined || b.priority === 0 ? -1 : b.priority;
      
      return priorityA - priorityB; 
    });
  }
  
  getDescription() {
    return 'Prioridad (↑ menor)';
  }
}

export class SortByPriorityDesc extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      const priorityA = a.priority === null || a.priority === undefined || a.priority === 0 ? 0 : a.priority;
      const priorityB = b.priority === null || b.priority === undefined || b.priority === 0 ? 0 : b.priority;
      
      return priorityB - priorityA; 
    });
  }
  
  getDescription() {
    return 'Prioridad (↓ mayor)';
  }
}

export class SortByDateAsc extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });
  }
}

export class SortByUpcomingDate extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      
      return dateA - dateB; 
    });
  }
  
  getDescription() {
    return 'Fecha próxima (↑ cercana)';
  }
}


export class SortByNameAsc extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '');
    });
  }
}


export class SorterFactory {
  static createSorter(sortType) {
    switch (sortType) {
      case 'priority-desc':
        return new SortByPriorityDesc();
      case 'priority-asc':
        return new SortByPriorityAsc();
      case 'date-asc':
        return new SortByDateAsc();
      case 'date-desc':
        return new SortByDateDesc();
      case 'name-asc':
        return new SortByNameAsc();
      case 'upcoming': 
        return new SortByUpcomingDate();
      default:
        return null;
    }
  }
}