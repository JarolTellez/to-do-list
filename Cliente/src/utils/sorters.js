/**
 * Abstract base class for sorting strategies using Strategy Pattern
 * @abstract
 * @class SortStrategy
 * @description Defines the interface for all task sorting algorithms
 */
class SortStrategy {
  /**
   * Sorts an array of tasks according to specific criteria
   * @abstract
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} New sorted array of tasks
   * @throws {Error} When method is not implemented by subclass
   */
  sort(tasks) {
    throw new Error("Método sort() debe ser implementado");
  }
}

/**
 * Sorting strategy for ascending priority order (lowest priority first)
 * @class SortByPriorityAsc
 * @extends SortStrategy
 * @description Sorts tasks by priority level in ascending order with null handling
 */
export class SortByPriorityAsc extends SortStrategy {
  /**
   * Sorts tasks by priority in ascending order
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} Tasks sorted by priority (lowest first)
   * @description
   * - Tasks with null/undefined/zero priority are treated as -1 (placed at end)
   * - Priority range: 1 (lowest) to 5 (highest)
   * - Returns new array without modifying original
   */
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      const priorityA =
        a.priority === null || a.priority === undefined || a.priority === 0
          ? -1
          : a.priority;
      const priorityB =
        b.priority === null || b.priority === undefined || b.priority === 0
          ? -1
          : b.priority;
      return priorityA - priorityB;
    });
  }
}

/**
 * Sorting strategy for descending priority order (highest priority first)
 * @class SortByPriorityDesc
 * @extends SortStrategy
 * @description Sorts tasks by priority level in descending order with null handling
 */
export class SortByPriorityDesc extends SortStrategy {
  /**
   * Sorts tasks by priority in descending order
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} Tasks sorted by priority (highest first)
   * @description
   * - Tasks with null/undefined/zero priority are treated as 0 (placed at end)
   * - Priority range: 1 (lowest) to 5 (highest)
   * - Returns new array without modifying original
   */
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      const priorityA =
        a.priority === null || a.priority === undefined || a.priority === 0
          ? 0
          : a.priority;
      const priorityB =
        b.priority === null || b.priority === undefined || b.priority === 0
          ? 0
          : b.priority;
      return priorityB - priorityA;
    });
  }
}

/**
 * Sorting strategy for ascending date order (oldest first)
 * @class SortByDateAsc
 * @extends SortStrategy
 * @description Sorts tasks by scheduled date in ascending order with null handling
 */
export class SortByDateAsc extends SortStrategy {
  /**
   * Sorts tasks by scheduled date in ascending order
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} Tasks sorted by scheduled date (oldest first)
   * @description
   * - Tasks without scheduled date are placed at the end
   * - Uses native Date parsing for consistent comparison
   * - Returns new array without modifying original
   */
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });
  }
}

/**
 * Sorting strategy for descending date order (newest first)
 * @class SortByDateDesc
 * @extends SortStrategy
 * @description Sorts tasks by scheduled date in descending order with null handling
 */
export class SortByDateDesc extends SortStrategy {
  /**
   * Sorts tasks by scheduled date in descending order
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} Tasks sorted by scheduled date (newest first)
   * @description
   * - Tasks without scheduled date are placed at the end
   * - Uses native Date parsing for consistent comparison
   * - Returns new array without modifying original
   */
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(b.scheduledDate) - new Date(a.scheduledDate);
    });
  }
}

/**
 * Sorting strategy for upcoming dates (closest dates first)
 * @class SortByUpcomingDate
 * @extends SortStrategy
 * @description Sorts tasks by scheduled date in ascending order for upcoming tasks
 */
export class SortByUpcomingDate extends SortStrategy {
  /**
   * Sorts tasks by scheduled date in ascending order
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} Tasks sorted by scheduled date (soonest first)
   * @description
   * - Same logic as SortByDateAsc but semantically different purpose
   * - Used specifically for "upcoming" task views
   * - Returns new array without modifying original
   */
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });
  }
}

/**
 * Sorting strategy for ascending name order (alphabetical A-Z)
 * @class SortByNameAsc
 * @extends SortStrategy
 * @description Sorts tasks by name in alphabetical order with null handling
 */
export class SortByNameAsc extends SortStrategy {
  /**
   * Sorts tasks by name in ascending alphabetical order
   * @function sort
   * @param {Array} tasks - Array of task objects to sort
   * @returns {Array} Tasks sorted by name (A-Z)
   * @description
   * - Uses locale-aware string comparison for proper alphabetical sorting
   * - Handles null/undefined names by treating them as empty strings
   * - Returns new array without modifying original
   */
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }
}

/**
 * Factory class for creating sorting strategy instances
 * @class SorterFactory
 * @description Provides centralized creation of sorting strategies using Factory Pattern
 */
export class SorterFactory {
  /**
   * Creates appropriate sorter instance based on sort type identifier
   * @static
   * @function createSorter
   * @param {string} sortType - Type identifier for sorting strategy
   * @returns {SortStrategy|null} Sorter instance or null if type not recognized
   * @example
   * // Returns SortByPriorityDesc instance
   * const sorter = SorterFactory.createSorter('priority-desc');
   *
   * // Supported sort types:
   * // - 'priority-desc': Highest priority first
   * // - 'priority-asc': Lowest priority first
   * // - 'date-asc': Oldest dates first
   * // - 'date-desc': Newest dates first
   * // - 'name-asc': Alphabetical A-Z
   * // - 'upcoming': Soonest dates first
   */
  static createSorter(sortType) {
    switch (sortType) {
      case "priority-desc":
        return new SortByPriorityDesc();
      case "priority-asc":
        return new SortByPriorityAsc();
      case "date-asc":
        return new SortByDateAsc();
      case "date-desc":
        return new SortByDateDesc();
      case "name-asc":
        return new SortByNameAsc();
      case "upcoming":
        return new SortByUpcomingDate();
      default:
        return null;
    }
  }
}
