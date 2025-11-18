import { useState, useCallback, useMemo } from "react";
import { FilterSort } from "../utils/filterSort";

/**
 * Task filtering and sorting management hook
 * @hook useFilters
 * @description Manages task filtering by status, priority, and date with sorting
 * @returns {Object} Filter state and methods
 */
export const useFilters = () => {
  const [filter, setFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const filterConfig = useMemo(
    () => ({
      status: filter,
      date: dateFilter,
      priority: priorityFilter,
    }),
    [filter, dateFilter, priorityFilter]
  );

  /**
   * Applies current filters to task list
   * @function applyFilters
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Filtered and sorted tasks
   */
  const applyFilters = useCallback(
    (tasks) => {
      if (!tasks || tasks.length === 0) {
        return [];
      }

      const uniqueTasks = tasks.filter(
        (task, index, self) => index === self.findIndex((t) => t.id === task.id)
      );

      const filterSort = new FilterSort();

      filterSort.setFilter(filterConfig.status, filterConfig.date);
      if (filterConfig.priority === "highest") {
        filterSort.addSorter("priority-desc");
      } else if (filterConfig.priority === "lowest") {
        filterSort.addSorter("priority-asc");
      }

      if (filterConfig.date === "upcoming") {
        filterSort.addSorter("upcoming");
      }

      if (filterConfig.date === "today" && !filterConfig.priority) {
        filterSort.addSorter("priority-desc");
      }

      const result = filterSort.execute(uniqueTasks);

      return result;
    },
    [filterConfig]
  );

  /**
   * Filter configuration actions
   * @namespace actions
   */
  const actions = useMemo(
    () => ({
      /**
       * Sets status filter
       * @function setFilter
       * @param {string} value - Filter value
       */
      setFilter: (value) => {
        setFilter((current) => {
          const newValue = current === value ? null : value;
          return newValue;
        });
      },

      /**
       * Sets priority filter
       * @function setPriorityFilter
       * @param {string} value - Filter value
       */
      setPriorityFilter: (value) => {
        setPriorityFilter((current) => {
          const newValue = current === value ? null : value;
          return newValue;
        });
      },

      /**
       * Sets date filter
       * @function setDateFilter
       * @param {string} value - Filter value
       */
      setDateFilter: (value) => {
        setDateFilter((current) => {
          const newValue = current === value ? null : value;
          return newValue;
        });
      },

      /**
       * Clears all active filters
       * @function clearAll
       */
      clearAll: () => {
        setFilter(null);
        setPriorityFilter(null);
        setDateFilter(null);
      },
    }),
    []
  );

  const hasActiveFilters = useMemo(
    () => !!(filter || priorityFilter || dateFilter),
    [filter, priorityFilter, dateFilter]
  );

  return {
    filter,
    priorityFilter,
    dateFilter,
    ...actions,
    applyFilters,
    hasActiveFilters,
  };
};
