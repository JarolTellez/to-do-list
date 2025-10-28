import React from 'react';
import InfiniteScrollList from '../common/InfiniteScrollList';
import TaskItem from './TaskItem';

const TaskList = ({ 
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
  const renderTaskItem = (task) => (
    <TaskItem 
      task={task}
      onToggleComplete={onToggleComplete}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
    />
  );

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
};

export default TaskList;