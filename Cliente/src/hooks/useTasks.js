import { useState, useEffect, useCallback, useMemo } from "react";
import { taskService } from "../services/tasks";
import { useToast } from "../contexts/ToastContexts";

export const useTasks = (userId) => {
  const [state, setState] = useState({
    tasks: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    currentPage: 1,
    totalTasks: 0,
  });

  const { showTaskToast } = useToast();

  const loadTasks = useCallback(
    async (page = 1, limit = 20) => {
      if (!userId) return;

      try {
        setState((prev) => ({
          ...prev,
          loading: page === 1,
          loadingMore: page > 1,
          error: null,
        }));

        const response = await taskService.findAllByUserId(page, limit);
        const tasksFromResponse = response.data.tasks || [];

        setState((prev) => ({
          tasks:
            page === 1
              ? tasksFromResponse
              : [...prev.tasks, ...tasksFromResponse],
          hasMore: response.data.pagination?.hasNext || false,
          currentPage: page,
          totalTasks: response.data.pagination?.total || 0,
          loading: false,
          loadingMore: false,
          error: null,
        }));
      } catch (error) {
        console.error("Error loading tasks:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Error cargando tareas",
          loading: false,
          loadingMore: false,
        }));
      }
    },
    [userId]
  );

  const loadMoreTasks = useCallback(async () => {
    if (state.loadingMore || !state.hasMore) {
      return;
    }
    try {
      setState((prev) => ({ ...prev, loadingMore: true }));
      await loadTasks(state.currentPage + 1, 20);
    } catch (error) {
      console.error("Error loading more tasks:", error);
      setState((prev) => ({
        ...prev,
        loadingMore: false,
      }));
    }
  }, [state.loadingMore, state.hasMore, state.currentPage, loadTasks]);

  const addTask = useCallback(
    async (taskData) => {
      const toast = showTaskToast("Agregando tarea...", "Tarea agregada");

      try {
        const response = await taskService.create(taskData);
        setState((prev) => ({
          ...prev,
          tasks: [response.data, ...prev.tasks],
          totalTasks: prev.totalTasks + 1,
        }));
        toast.success();
        return response;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [showTaskToast]
  );

  const updateTask = useCallback(
    async (taskData) => {
      const toast = showTaskToast("Actualizando tarea...", "Tarea actualizada");

      try {
        const response = await taskService.update(taskData);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskData.id ? { ...task, ...response.data } : task
          ),
        }));
        toast.success();
        return response;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [showTaskToast]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      const toast = showTaskToast("Eliminando tarea...", "Tarea eliminada");

      try {
        const response = await taskService.delete(taskId);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((task) => task.id !== taskId),
          totalTasks: prev.totalTasks - 1,
        }));
        toast.success();
        return response;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [showTaskToast]
  );

  const toggleTaskCompletion = useCallback(
    async (taskId, isCompleted) => {
      const action = isCompleted ? "Completando" : "Marcando como pendiente";
      const successMessage = isCompleted
        ? "Tarea completada"
        : "Tarea marcada como pendiente";

      const toast = showTaskToast(`${action} tarea...`, successMessage);

      try {
        const response = await taskService.complete(taskId, isCompleted);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? { ...task, isCompleted } : task
          ),
        }));
        toast.success();
        return response;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [showTaskToast]
  );

  const refreshTasks = useCallback(() => {
    loadTasks(1, 20);
  }, [loadTasks]);

  useEffect(() => {
    if (userId) {
      loadTasks(1, 20);
    }
  }, [loadTasks, userId]);

  return useMemo(
    () => ({
      ...state,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      refreshTasks,
      loadMoreTasks,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      refreshTasks,
      loadMoreTasks,
    ]
  );
};
