class Specification {
  satisfies(task) {
    throw new Error("Método satisfies() debe ser implementado");
  }

  and(otherSpec) {
    return new AndSpecification(this, otherSpec);
  }

  or(otherSpec) {
    return new OrSpecification(this, otherSpec);
  }

  not() {
    return new NotSpecification(this);
  }
}

class AndSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  satisfies(task) {
    return this.left.satisfies(task) && this.right.satisfies(task);
  }
}

class OrSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  satisfies(task) {
    return this.left.satisfies(task) || this.right.satisfies(task);
  }
}

class NotSpecification extends Specification {
  constructor(spec) {
    super();
    this.spec = spec;
  }

  satisfies(task) {
    return !this.spec.satisfies(task);
  }
}

export class AllTasksSpecification extends Specification {
  satisfies(task) {
    return true;
  }
}

export class PendingTaskSpecification extends Specification {
  satisfies(task) {
    const isPending = task.isCompleted === false;
    return isPending;
  }
}

export class CompletedTaskSpecification extends Specification {
  satisfies(task) {
    const isCompleted = task.isCompleted === true;
    return isCompleted;
  }
}

export class UpcomingTasksSpecification extends Specification {
  satisfies(task) {
    if (!task.scheduledDate) return false;
    if (task.isCompleted) return false;
    
    const today = new Date();
    const taskDate = new Date(task.scheduledDate);
 
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    const isUpcoming = taskDate >= today;
    
    return isUpcoming;
  }
}

export class DueTodaySpecification extends Specification {
  satisfies(task) {
    if (!task.scheduledDate) return false;
    if (task.isCompleted) return false; 
    
    const today = new Date();
    const taskDate = new Date(task.scheduledDate);
    

    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    const isToday = taskDate.getTime() === today.getTime();
    
    return isToday;
  }
}


export class OverdueTaskSpecification extends Specification {
  satisfies(task) {
    return task.isOverdue;
  }
}

export class SpecificationFactory {
  static createStatusFilter(status) {
    
    switch (status) {
      case 'pending':
        return new PendingTaskSpecification();
      case 'completed':
        return new CompletedTaskSpecification();
      case 'overdue':
        return new OverdueTaskSpecification();
      default:
        return new AllTasksSpecification();
    }
  }

  static createDateFilter(dateFilter) {
    
    switch (dateFilter) {
      case 'today':
        return new DueTodaySpecification();
      case 'upcoming':
        return new UpcomingTasksSpecification();
      default:
        return new AllTasksSpecification();
    }
  }
}