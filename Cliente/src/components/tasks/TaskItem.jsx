import React, { memo, useCallback } from "react";
import { FaCalendar, FaRegTrashAlt } from "react-icons/fa";
import { formatDateForDisplay } from "../../utils/formatDate";
import { TASK_PRIORITIES } from "../../utils/constants/taskConstans";

const TaskItem = memo(
  ({ task, onToggleComplete, onEditTask, onDeleteTask }) => {
    const handleToggleComplete = useCallback(() => {
      if (!task.isCompleted) {
        onToggleComplete(task.id, !task.isCompleted);
      }
    }, [task.isCompleted, task.id, onToggleComplete]);

    const handleEdit = useCallback(() => {
      if (!task.isCompleted) {
        onEditTask(task);
      }
    }, [task.isCompleted, task, onEditTask]);

    const handleDelete = useCallback(() => {
      onDeleteTask(task.id);
    }, [task.id, onDeleteTask]);

    const canEdit = !task.isCompleted;
    const displayTags = task.tags || [];
    const priorityColor = TASK_PRIORITIES[task.priority]?.color || "#007bff";

    return (
      <div className={`task-item-card ${task.isCompleted ? "completed" : ""}`}>
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
            className={`task-checkbox-label ${
              task.isCompleted ? "completed-checkbox" : ""
            }`}
            title={
              task.isCompleted ? "Tarea completada" : "Marcar como completada"
            }
          />
        </div>

        <button
          className="task-delete-btn"
          onClick={handleDelete}
          title="Eliminar tarea"
        >
           <FaRegTrashAlt size={14} />
        </button>

        <div
          className="task-content"
          onClick={handleEdit}
          style={{ cursor: canEdit ? "pointer" : "default" }}
          title={canEdit ? "Haz clic para editar" : "Tarea completada"}
        >
          <h3 className="task-item-title">{task.name}</h3>

          {task.scheduledDate && (
            <p className="task-date">
              <span className="task-calendar"><FaCalendar className="task-calendar" /></span>
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
                  backgroundColor: priorityColor,
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
                  {displayTags.map((tag) => (
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.isCompleted === nextProps.task.isCompleted &&
      prevProps.task.name === nextProps.task.name &&
      prevProps.task.description === nextProps.task.description &&
      prevProps.task.scheduledDate === nextProps.task.scheduledDate &&
      prevProps.task.priority === nextProps.task.priority &&
      prevProps.task.tags?.length === nextProps.task.tags?.length &&
      (prevProps.task.tags?.every(
        (tag, index) => tag.id === nextProps.task.tags?.[index]?.id
      ) ??
        true)
    );
  }
);

TaskItem.displayName = "TaskItem";

export default TaskItem;
