/**
 * Abstract base class for specification pattern implementations
 * @abstract
 * @class Specification
 * @description Defines the interface for business rule specifications with composite operations
 */
class Specification {
  /**
   * Evaluates if a task satisfies the specification criteria
   * @abstract
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task satisfies the specification
   * @throws {Error} When method is not implemented by subclass
   */
  satisfies(task) {
    throw new Error("Método satisfies() debe ser implementado");
  }

  /**
   * Creates AND composite specification
   * @function and
   * @param {Specification} otherSpec - Other specification to combine with AND
   * @returns {AndSpecification} New composite specification
   */
  and(otherSpec) {
    return new AndSpecification(this, otherSpec);
  }

  /**
   * Creates OR composite specification
   * @function or
   * @param {Specification} otherSpec - Other specification to combine with OR
   * @returns {OrSpecification} New composite specification
   */
  or(otherSpec) {
    return new OrSpecification(this, otherSpec);
  }

  /**
   * Creates NOT composite specification (negation)
   * @function not
   * @returns {NotSpecification} New negated specification
   */
  not() {
    return new NotSpecification(this);
  }
}

/**
 * AND composite specification
 * @class AndSpecification
 * @extends Specification
 * @description Combines two specifications with logical AND operation
 */
class AndSpecification extends Specification {
  /**
   * Creates AND specification
   * @constructor
   * @param {Specification} left - Left side specification
   * @param {Specification} right - Right side specification
   */
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  /**
   * Evaluates if task satisfies both specifications
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task satisfies both specifications
   */
  satisfies(task) {
    return this.left.satisfies(task) && this.right.satisfies(task);
  }
}

/**
 * OR composite specification
 * @class OrSpecification
 * @extends Specification
 * @description Combines two specifications with logical OR operation
 */
class OrSpecification extends Specification {
  /**
   * Creates OR specification
   * @constructor
   * @param {Specification} left - Left side specification
   * @param {Specification} right - Right side specification
   */
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  /**
   * Evaluates if task satisfies at least one specification
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task satisfies either specification
   */
  satisfies(task) {
    return this.left.satisfies(task) || this.right.satisfies(task);
  }
}

/**
 * NOT composite specification (negation)
 * @class NotSpecification
 * @extends Specification
 * @description Negates the result of another specification
 */
class NotSpecification extends Specification {
  /**
   * Creates NOT specification
   * @constructor
   * @param {Specification} spec - Specification to negate
   */
  constructor(spec) {
    super();
    this.spec = spec;
  }

  /**
   * Evaluates if task does NOT satisfy the specification
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task does not satisfy the specification
   */
  satisfies(task) {
    return !this.spec.satisfies(task);
  }
}

/**
 * Universal specification that matches all tasks
 * @class AllTasksSpecification
 * @extends Specification
 * @description Always returns true, used as default or neutral element
 */
export class AllTasksSpecification extends Specification {
  /**
   * Always returns true for any task
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Always true
   */
  satisfies(task) {
    return true;
  }
}

/**
 * Specification for pending (incomplete) tasks
 * @class PendingTaskSpecification
 * @extends Specification
 * @description Matches tasks that are not completed
 */
export class PendingTaskSpecification extends Specification {
  /**
   * Evaluates if task is pending (not completed)
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task is not completed
   */
  satisfies(task) {
    const isPending = task.isCompleted === false;
    return isPending;
  }
}

/**
 * Specification for completed tasks
 * @class CompletedTaskSpecification
 * @extends Specification
 * @description Matches tasks that are completed
 */
export class CompletedTaskSpecification extends Specification {
  /**
   * Evaluates if task is completed
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task is completed
   */
  satisfies(task) {
    const isCompleted = task.isCompleted === true;
    return isCompleted;
  }
}

/**
 * Specification for upcoming tasks (future dates)
 * @class UpcomingTasksSpecification
 * @extends Specification
 * @description Matches tasks with scheduled dates today or in the future
 */
export class UpcomingTasksSpecification extends Specification {
  /**
   * Evaluates if task is upcoming (today or future date, not completed)
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task is upcoming
   * @description
   * - Task must have scheduled date
   * - Task must not be completed
   * - Scheduled date must be today or in the future
   */
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

/**
 * Specification for tasks due today
 * @class DueTodaySpecification
 * @extends Specification
 * @description Matches tasks scheduled for today that are not completed
 */
export class DueTodaySpecification extends Specification {
  /**
   * Evaluates if task is due today
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task is due today
   * @description
   * - Task must have scheduled date
   * - Task must not be completed
   * - Scheduled date must be exactly today
   */
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

/**
 * Specification for overdue tasks
 * @class OverdueTaskSpecification
 * @extends Specification
 * @description Matches tasks that are marked as overdue
 */
export class OverdueTaskSpecification extends Specification {
  /**
   * Evaluates if task is overdue
   * @function satisfies
   * @param {Object} task - Task object to evaluate
   * @returns {boolean} Whether task is overdue
   * @description Uses pre-calculated isOverdue property from task object
   */
  satisfies(task) {
    return task.isOverdue;
  }
}

/**
 * Factory class for creating specification instances
 * @class SpecificationFactory
 * @description Provides centralized creation of specifications using Factory Pattern
 */
export class SpecificationFactory {
  /**
   * Creates status-based specification
   * @static
   * @function createStatusFilter
   * @param {string} status - Status identifier
   * @returns {Specification} Appropriate status specification
   * @example
   * // Returns PendingTaskSpecification instance
   * const spec = SpecificationFactory.createStatusFilter('pending');
   *
   * // Supported status values:
   * // - 'pending': Incomplete tasks
   * // - 'completed': Completed tasks
   * // - 'overdue': Overdue tasks
   * // - default: All tasks
   */
  static createStatusFilter(status) {
    switch (status) {
      case "pending":
        return new PendingTaskSpecification();
      case "completed":
        return new CompletedTaskSpecification();
      case "overdue":
        return new OverdueTaskSpecification();
      default:
        return new AllTasksSpecification();
    }
  }

  /**
   * Creates date-based specification
   * @static
   * @function createDateFilter
   * @param {string} dateFilter - Date filter identifier
   * @returns {Specification} Appropriate date specification
   * @example
   * // Returns DueTodaySpecification instance
   * const spec = SpecificationFactory.createDateFilter('today');
   *
   * // Supported date filters:
   * // - 'today': Tasks due today
   * // - 'upcoming': Tasks due today or in future
   * // - default: All tasks
   */
  static createDateFilter(dateFilter) {
    switch (dateFilter) {
      case "today":
        return new DueTodaySpecification();
      case "upcoming":
        return new UpcomingTasksSpecification();
      default:
        return new AllTasksSpecification();
    }
  }
}
