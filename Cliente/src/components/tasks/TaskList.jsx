import React, { useRef, useEffect } from 'react';
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
  const loadingRef = useRef();

  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [loadingMore, hasMore, onLoadMore]);

  if (loading && tasks.length === 0) {
    return (
      <div className="task-list-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (emptyMessage && tasks.length === 0) {
    return (
      <div className="task-list-wrapper">
        <div className="empty-message">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="task-list-wrapper">
      <div className="task-list">
        {tasks.map((task) => (
          <TaskItem 
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={loadingRef} className="scroll-detector" />
      )}
      
      {loadingMore && (
        <div className="footer-message">
          <div className="spinner-small"></div>
          <p style={{ marginTop: '10px' }}>Cargando más tareas...</p>
        </div>
      )}
      
      {!hasMore && tasks.length > 0 && (
        <div className="footer-message">
          No hay mas tareas para mostrar
        </div>
      )}
    </div>
  );
};

export default TaskList;