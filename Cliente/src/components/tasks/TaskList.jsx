import React, { memo, useCallback } from 'react';
import InfiniteScrollList from '../common/InfiniteScrollList';
import TaskItem from './TaskItem';

const TaskList = memo(({ 
  tasks, 
  onToggleComplete, 
  onEditTask, 
  onDeleteTask, 
  loading, 
  loadingMore,
  hasMore,
  onLoadMore,
  emptyMessage 
}) => {
  const renderTaskItem = useCallback((task) => (
    <TaskItem 
      task={task}
      onToggleComplete={onToggleComplete}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
    />
  ), [onToggleComplete, onEditTask, onDeleteTask]);

  return (
    <div className="task-list-wrapper">
      <InfiniteScrollList
        items={tasks}
        renderItem={renderTaskItem}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        emptyMessage={emptyMessage}
        loadingMessage="Cargando tareas..."
        loadingMoreMessage="Cargando más tareas..."
        listClassName="task-list"
      />
    </div>
  );
});

TaskList.displayName = 'TaskList';

export default TaskList;
