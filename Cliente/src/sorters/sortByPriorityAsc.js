import { SortStrategy } from "./sortStrategy.js";

export class SortByPriorityAsc extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.priority === null || a.priority === undefined) return 1;
      if (b.priority === null || b.priority === undefined) return -1;
      return a.priority - b.priority;
    });
  }
}
