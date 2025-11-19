import {
  SpecificationFactory,
  AllTasksSpecification,
} from "./specifications.js";
import { SorterFactory } from "./sorters.js";

/**
 * Composite class for filtering and sorting tasks
 * @class FilterSort
 * @description Combines Specification Pattern for filtering with Strategy Pattern for sorting
 */
export class FilterSort {
  constructor() {
    this.sorterStrategies = [];
    this.filterSpecification = new AllTasksSpecification();
  }

  /**
   * Adds sorting strategy to the pipeline
   * @function addSorter
   * @param {string} sortType - Type identifier for sorting strategy
   * @returns {FilterSort} Returns self for method chaining
   */
  addSorter(sortType) {
    const sorter = SorterFactory.createSorter(sortType);
    if (sorter) {
      this.sorterStrategies.push(sorter);
    }
    return this;
  }

  /**
   * Sets filtering criteria using status and date filters
   * @function setFilter
   * @param {string} statusFilter - Status filter identifier
   * @param {string} dateFilter - Date filter identifier
   * @returns {FilterSort} Returns self for method chaining
   * @description Combines status and date specifications with AND operation
   */
  setFilter(statusFilter, dateFilter) {
    const statusSpec = statusFilter
      ? SpecificationFactory.createStatusFilter(statusFilter)
      : new AllTasksSpecification();

    const dateSpec = dateFilter
      ? SpecificationFactory.createDateFilter(dateFilter)
      : new AllTasksSpecification();

    this.filterSpecification = statusSpec.and(dateSpec);

    return this;
  }

  /**
   * Clears all sorting strategies
   * @function clearSorters
   * @returns {FilterSort} Returns self for method chaining
   */
  clearSorters() {
    this.sorterStrategies = [];
    return this;
  }

  /**
   * Clears all filters (resets to show all tasks)
   * @function clearFilters
   * @returns {FilterSort} Returns self for method chaining
   */
  clearFilters() {
    this.filterSpecification = new AllTasksSpecification();
    return this;
  }

  /**
   * Executes filtering and sorting pipeline on task array
   * @function execute
   * @param {Array} tasks - Array of task objects to process
   * @returns {Array} Filtered and sorted array of tasks
   * @description
   * 1. First applies filtering using specification pattern
   * 2. Then applies sorting using strategy pattern
   * 3. Returns new array without modifying original
   */
  execute(tasks) {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    let result = tasks.filter((task) => {
      const satisfies = this.filterSpecification.satisfies(task);
      if (satisfies) {
      }
      return satisfies;
    });

    if (this.sorterStrategies.length > 0) {
      this.sorterStrategies.forEach((sorter, index) => {
        const beforeSort = result.length;
        result = sorter.sort(result);
      });
    }

    return result;
  }
}
