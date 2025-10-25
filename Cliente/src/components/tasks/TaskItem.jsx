import React from 'react';
import { formatDateForDisplay } from '../../utils/formatDate';
import { TASK_PRIORITIES } from '../../utils/constants/taskConstans';

const TaskItem = ({ task, onToggleComplete, onEditTask, onDeleteTask }) => {
  const handleToggleComplete = () => {
    if (!task.isCompleted) {
      onToggleComplete(task.id, !task.isCompleted);
    }
  };

  const handleEdit = () => {
    if (!task.isCompleted) {
      onEditTask(task);
    }
  };

  const handleDelete = () => {
    onDeleteTask(task.id);
  };

  const canEdit = !task.isCompleted;
  const displayTags = task.tags || [];
  const priorityColor = TASK_PRIORITIES[task.priority]?.color || '#007bff';

  return (
    <div className={`task-item-card ${task.isCompleted ? 'completed' : ''}`}>
      <div className="task-completion-container">
        <input 
          type="checkbox" 
          className="task-completion-checkbox" 
          checked={task.isCompleted || false}
          onChange={handleToggleComplete}
          id={`task-completion-${task.id}`}
          disabled={task.isCompleted}
        />
        <label 
          htmlFor={`task-completion-${task.id}`} 
          className={`task-checkbox-label ${task.isCompleted ? 'completed-checkbox' : ''}`}
          title={task.isCompleted ? "Tarea completada" : "Marcar como completada"}
        />
      </div>
      
      <button 
        className="task-delete-btn"
        onClick={handleDelete}
        title="Eliminar tarea"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48" fill="currentColor">
          <path d="M 24 4 C 20.491685 4 17.570396 6.6214322 17.080078 10 L 10.238281 10 A 1.50015 1.50015 0 0 0 9.9804688 9.9785156 A 1.50015 1.50015 0 0 0 9.7578125 10 L 6.5 10 A 1.50015 1.50015 0 1 0 6.5 13 L 8.6386719 13 L 11.15625 39.029297 C 11.427329 41.835926 13.811782 44 16.630859 44 L 31.367188 44 C 34.186411 44 36.570826 41.836168 36.841797 39.029297 L 39.361328 13 L 41.5 13 A 1.50015 1.50015 0 1 0 41.5 10 L 38.244141 10 A 1.50015 1.50015 0 0 0 37.763672 10 L 30.919922 10 C 30.429604 6.6214322 27.508315 4 24 4 z M 24 7 C 25.879156 7 27.420767 8.2681608 27.861328 10 L 20.138672 10 C 20.579233 8.2681608 22.120844 7 24 7 z M 11.650391 13 L 36.347656 13 L 33.855469 38.740234 C 33.730439 40.035363 32.667963 41 31.367188 41 L 16.630859 41 C 15.331937 41 14.267499 40.033606 14.142578 38.740234 L 11.650391 13 z M 20.476562 17.978516 A 1.50015 1.50015 0 0 0 19 19.5 L 19 34.5 A 1.50015 1.50015 0 1 0 22 34.5 L 22 19.5 A 1.50015 1.50015 0 0 0 20.476562 17.978516 z M 27.476562 17.978516 A 1.50015 1.50015 0 0 0 26 19.5 L 26 34.5 A 1.50015 1.50015 0 1 0 29 34.5 L 29 19.5 A 1.50015 1.50015 0 0 0 27.476562 17.978516 z"/>
        </svg>
      </button>
      
      <div 
        className="task-content" 
        onClick={handleEdit} 
        style={{ cursor: canEdit ? 'pointer' : 'default' }}
        title={canEdit ? "Haz clic para editar" : "Tarea completada"}
      >
        <h3 className="task-item-title">{task.name}</h3>
        
        {task.scheduledDate && (
          <p className="task-date">
            <span className="task-calendar">📅</span>
            {formatDateForDisplay(new Date(task.scheduledDate))}
          </p>
        )}
        
        {task.description && (
          <p className="task-description-scroll task-description-text">
            {task.description}
          </p>
        )}
        
        {task.priority && (
          <div className="task-priority-container">
            <span className="task-priority-text">Prioridad</span>
            <div 
              className="task-priority-bar" 
              style={{ 
                width: `${task.priority * 20}%`,
                background: `linear-gradient(to right, rgba(0, 128, 0, 0.3), ${priorityColor})`
              }}
            >
              <span className="task-priority-number">{task.priority}</span>
            </div>
          </div>
        )}
        
        {displayTags.length > 0 && (
          <div className="task-tags-container">
            <strong>Etiquetas:</strong>
            <div className="task-tags-list-container">
              <ul className="task-tags-list">
                {displayTags.map(tag => (
                  <li key={tag.id} className="task-tag-item">
                    {tag.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;