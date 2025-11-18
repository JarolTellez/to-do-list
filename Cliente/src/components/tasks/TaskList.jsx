import React, { memo, useCallback } from "react";
import InfiniteScrollList from "../common/InfiniteScrollList";
import TaskItem from "./TaskItem";

/**
 * Task list container with infinite scroll
 * @component TaskList
 * @description Renders list of tasks with infinite scroll capabilities
 * @param {Object} props - Component properties
 * @param {Array} props.tasks - Array of task objects
 * @param {Function} props.onToggleComplete - Task completion toggle callback
 * @param {Function} props.onEditTask - Task edit callback
 * @param {Function} props.onDeleteTask - Task delete callback
 * @param {boolean} props.loading - Initial loading state
 * @param {boolean} props.loadingMore - Loading more tasks state
 * @param {boolean} props.hasMore - Whether more tasks are available
 * @param {Function} props.onLoadMore - Load more tasks callback
 * @param {string} props.emptyMessage - Message when no tasks available
 * @returns {JSX.Element} Task list container
 */
const TaskList = memo(
  ({
    tasks,
    onToggleComplete,
    onEditTask,
    onDeleteTask,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    emptyMessage,
  }) => {
    /**
     * Renders individual task item
     * @function renderTaskItem
     * @param {Object} task - Task object
     * @returns {JSX.Element} Rendered task item
     */
    const renderTaskItem = useCallback(
      (task) => (
        <TaskItem
          task={task}
          onToggleComplete={onToggleComplete}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      ),
      [onToggleComplete, onEditTask, onDeleteTask]
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
  }
);

TaskList.displayName = "TaskList";

export default TaskList;
