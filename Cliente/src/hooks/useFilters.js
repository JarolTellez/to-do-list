import { useState, useCallback, useMemo } from 'react';
import { FilterSort } from '../utils/filterSort';

export const useFilters = () => {
  const [filter, setFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const filterConfig = useMemo(() => ({
    status: filter,
    date: dateFilter,
    priority: priorityFilter
  }), [filter, dateFilter, priorityFilter]);

  const applyFilters = useCallback((tasks) => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    const uniqueTasks = tasks.filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    );

    const filterSort = new FilterSort();

    filterSort.setFilter(filterConfig.status, filterConfig.date);
    if (filterConfig.priority === 'highest') {
      filterSort.addSorter('priority-desc');
    } else if (filterConfig.priority === 'lowest') {
      filterSort.addSorter('priority-asc');
    }
    
    if (filterConfig.date === 'upcoming') {
      filterSort.addSorter('upcoming');
    }

    if (filterConfig.date === 'today' && !filterConfig.priority) {
      filterSort.addSorter('priority-desc');
    }

    const result = filterSort.execute(uniqueTasks);

    return result;
  }, [filterConfig]);

  const actions = useMemo(() => ({
    setFilter: (value) => {
      setFilter(current => {
        const newValue = current === value ? null : value;
        return newValue;
      });
    },
    
    setPriorityFilter: (value) => {
      setPriorityFilter(current => {
        const newValue = current === value ? null : value;
        return newValue;
      });
    },
    
    setDateFilter: (value) => {
      setDateFilter(current => {
        const newValue = current === value ? null : value;
        return newValue;
      });
    },
    
    clearAll: () => {
      setFilter(null);
      setPriorityFilter(null);
      setDateFilter(null);
    }
  }), []);

  const hasActiveFilters = useMemo(() => 
    !!(filter || priorityFilter || dateFilter),
    [filter, priorityFilter, dateFilter]
  );

  return {
    filter,
    priorityFilter,
    dateFilter,
    ...actions,
    applyFilters,
    hasActiveFilters
  };
};