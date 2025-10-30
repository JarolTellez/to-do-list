import { SpecificationFactory, AllTasksSpecification } from './specifications.js';
import { SorterFactory } from './sorters.js';

export class FilterSort {
  constructor() {
    this.sorterStrategies = [];
    this.filterSpecification = new AllTasksSpecification();
  }

  addSorter(sortType) {
    const sorter = SorterFactory.createSorter(sortType);
    if (sorter) {
      this.sorterStrategies.push(sorter);
    }
    return this;
  }

  setFilter(statusFilter, dateFilter) {

    const statusSpec = statusFilter ? 
      SpecificationFactory.createStatusFilter(statusFilter) : 
      new AllTasksSpecification();
    
    const dateSpec = dateFilter ? 
      SpecificationFactory.createDateFilter(dateFilter) : 
      new AllTasksSpecification();

    this.filterSpecification = statusSpec.and(dateSpec);

    
    return this;
  }

  clearSorters() {
    this.sorterStrategies = [];
    return this;
  }

  clearFilters() {
    this.filterSpecification = new AllTasksSpecification();
    return this;
  }

  execute(tasks) {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    let result = tasks.filter(task => {
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