import { useState, useEffect, useCallback, useMemo } from "react";
import { taskService } from "../services/tasks";
import { useToast } from "../contexts/ToastContexts";
import { PAGINATION_CONFIG } from "../utils/constants/paginationConstants";
const TASKS_PAGINATION = PAGINATION_CONFIG.TASKS;

export const useTasks = (userId) => {
  const [state, setState] = useState({
    tasks: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    currentPage: TASKS_PAGINATION.INITIAL_PAGE,
    totalTasks: 0,
    pendingCount: 0,
    completedCount: 0,
    overdueCount: 0,
  });

  const { showTaskToast } = useToast();

  const updateStatsFromLocalChanges = useCallback(
    (action, taskData, previousTaskState = null) => {
      setState((prev) => {
        let newPending = prev.pendingCount;
        let newCompleted = prev.completedCount;
        let newOverdue = prev.overdueCount;

        switch (action) {
          case "ADD_TASK":
            if (taskData.isCompleted) {
              newCompleted += 1;
            } else {
              newPending += 1;
              if (taskData.isOverdue) newOverdue += 1;
            }
            break;

          case "DELETE_TASK":
            if (taskData.isCompleted) {
              newCompleted -= 1;
            } else {
              newPending -= 1;
              if (taskData.isOverdue) newOverdue -= 1;
            }
            break;

          case "TOGGLE_COMPLETE":
            if (taskData.isCompleted) {
              newPending -= 1;
              newCompleted += 1;
              if (previousTaskState?.isOverdue) newOverdue -= 1;
            } else {
              newPending += 1;
              newCompleted -= 1;
              if (taskData.isOverdue) newOverdue += 1;
            }
            break;

          case "UPDATE_TASK":
            if (previousTaskState) {
              if (previousTaskState.isCompleted) {
                newCompleted -= 1;
              } else {
                newPending -= 1;
                if (previousTaskState.isOverdue) newOverdue -= 1;
              }

              if (taskData.isCompleted) {
                newCompleted += 1;
              } else {
                newPending += 1;
                if (taskData.isOverdue) newOverdue += 1;
              }
            }
            break;
        }

        return {
          ...prev,
          pendingCount: Math.max(0, newPending),
          completedCount: Math.max(0, newCompleted),
          overdueCount: Math.max(0, newOverdue),
        };
      });
    },
    []
  );

  const validateStatsConsistency = useCallback((tasks) => {
    const calculatedPending = tasks.filter((task) => !task.isCompleted).length;
    const calculatedCompleted = tasks.filter((task) => task.isCompleted).length;
    const calculatedOverdue = tasks.filter(
      (task) => !task.isCompleted && task.isOverdue
    ).length;

    return {
      pending: calculatedPending,
      completed: calculatedCompleted,
      overdue: calculatedOverdue,
    };
  }, []);

  const loadTasks = useCallback(
    async (page, limit) => {
      if (!userId) return;

      try {
        setState((prev) => ({
          ...prev,
          loading: page === TASKS_PAGINATION.INITIAL_PAGE,
          loadingMore: page > TASKS_PAGINATION.INITIAL_PAGE,
          error: null,
        }));

        const response = await taskService.findAllByUserId(
          page || TASKS_PAGINATION.INITIAL_PAGE,
          limit || TASKS_PAGINATION.DEFAULT_LIMIT
        );

        const tasksFromResponse = response.data.tasks || [];
        const paginationInfo = response.data.pagination || {};

        setState((prev) => {
          const newTasks =
            page === TASKS_PAGINATION.INITIAL_PAGE
              ? tasksFromResponse
              : [...prev.tasks, ...tasksFromResponse];

          return {
            tasks: newTasks,
            hasMore:
              paginationInfo.hasNext ||
              tasksFromResponse.length >=
                (limit || TASKS_PAGINATION.DEFAULT_LIMIT),
            currentPage: page,
            totalTasks:
              paginationInfo.total ||
              prev.totalTasks + tasksFromResponse.length,
            completedCount: paginationInfo.counts?.completed || 0,
            pendingCount: paginationInfo.counts?.pending || 0,
            overdueCount: paginationInfo.counts?.overdue || 0,
            loading: false,
            loadingMore: false,
            error: null,
          };
        });
      } catch (error) {
        console.error("Error loading tasks:", error);

        if (error.status !== 401) {
          setState((prev) => ({
            ...prev,
            error: error.message || "Error cargando tareas",
            loading: false,
            loadingMore: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            loadingMore: false,
          }));
        }
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
      await loadTasks(state.currentPage + 1, TASKS_PAGINATION.LOAD_MORE_LIMIT);
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

        updateStatsFromLocalChanges("ADD_TASK", response.data);

        toast.success();
        return response;
      } catch (error) {
        if (error.status === 401) {
          toast.dismiss();
        } else {
          toast.error(error.message);
        }
        throw error;
      }
    },
    [showTaskToast, updateStatsFromLocalChanges]
  );

  const updateTask = useCallback(
    async (taskData) => {
      const toast = showTaskToast("Actualizando tarea...", "Tarea actualizada");

      try {
        const previousTask = state.tasks.find(
          (task) => task.id === taskData.id
        );
        const response = await taskService.update(taskData);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskData.id ? { ...task, ...response.data } : task
          ),
        }));

        if (previousTask) {
          updateStatsFromLocalChanges(
            "UPDATE_TASK",
            response.data,
            previousTask
          );
        }

        toast.success();
        return response;
      } catch (error) {
        if (error.status === 401) {
          toast.dismiss();
        } else {
          toast.error(error.message);
        }
        throw error;
      }
    },
    [showTaskToast, updateStatsFromLocalChanges, state.tasks]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      const toast = showTaskToast("Eliminando tarea...", "Tarea eliminada");

      try {
        const taskToDelete = state.tasks.find((task) => task.id === taskId);
        const response = await taskService.delete(taskId);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((task) => task.id !== taskId),
          totalTasks: prev.totalTasks - 1,
        }));
        if (taskToDelete) {
          updateStatsFromLocalChanges("DELETE_TASK", taskToDelete);
        }

        toast.success();
        return response;
      } catch (error) {
        if (error.status === 401) {
          toast.dismiss();
        } else {
          toast.error(error.message);
        }
        throw error;
      }
    },
    [showTaskToast, updateStatsFromLocalChanges, state.tasks]
  );

  const toggleTaskCompletion = useCallback(
    async (taskId, isCompleted) => {
      const action = isCompleted ? "Completando" : "Marcando como pendiente";
      const successMessage = isCompleted
        ? "Tarea completada"
        : "Tarea marcada como pendiente";

      const toast = showTaskToast(`${action} tarea...`, successMessage);

      try {
        const previousTask = state.tasks.find((task) => task.id === taskId);
        const response = await taskService.complete(taskId, isCompleted);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? { ...task, isCompleted } : task
          ),
        }));
        if (previousTask) {
          updateStatsFromLocalChanges(
            "TOGGLE_COMPLETE",
            { ...previousTask, isCompleted },
            previousTask
          );
        }
        toast.success();
        return response;
      } catch (error) {
        if (error.status === 401) {
          toast.dismiss();
        } else {
          toast.error(error.message);
        }
        throw error;
      }
    },
    [showTaskToast, updateStatsFromLocalChanges, state.tasks]
  );

  const refreshTasks = useCallback(
    async (forceSync = false) => {
      try {
        const response = await loadTasks(
          TASKS_PAGINATION.INITIAL_PAGE,
          TASKS_PAGINATION.REFRESH_LIMIT
        );

        const localTotal = state.tasks.length;
        const serverTotal = response.data.pagination?.total || 0;

        if (forceSync || Math.abs(localTotal - serverTotal) > 2) {
          await loadTasks(
            TASKS_PAGINATION.INITIAL_PAGE,
            TASKS_PAGINATION.REFRESH_LIMIT
          );
        }

        return response;
      } catch (error) {
        console.error("Error refreshing tasks:", error);
        throw error;
      }
    },
    [loadTasks, state.tasks.length]
  );

  const correctStatsFromCurrentTasks = useCallback(() => {
    const correctedStats = validateStatsConsistency(state.tasks);
    setState((prev) => ({
      ...prev,
      pendingCount: correctedStats.pending,
      completedCount: correctedStats.completed,
      overdueCount: correctedStats.overdue,
    }));
  }, [state.tasks, validateStatsConsistency]);

  useEffect(() => {
    if (userId) {
      loadTasks(TASKS_PAGINATION.INITIAL_PAGE, TASKS_PAGINATION.DEFAULT_LIMIT);
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
      correctStatsFromCurrentTasks,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      refreshTasks,
      loadMoreTasks,
      correctStatsFromCurrentTasks,
    ]
  );
};
