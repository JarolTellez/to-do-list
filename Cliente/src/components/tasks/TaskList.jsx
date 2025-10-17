import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onToggleComplete, onEditTask, onDeleteTask, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="task-list">
        <div className="loading">Cargando tareas...</div>
      </div>
    );
  }

  if (emptyMessage && tasks.length === 0) {
    return (
      <div className="task-list">
        <div className="empty-message">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div id="taskList" className="task-list">
      {tasks.map(task => (
        <TaskItem 
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
};

export default TaskList;