import { useState, useEffect, useCallback, useMemo } from "react";
import { taskService } from "../services/tasks";
import { useToast } from "../contexts/ToastContexts";

export const useTasks = (userId) => {
  const [state, setState] = useState({
    tasks: [],
    loading: false,
    error: null
  });

  const { showTaskToast } = useToast();

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const executeWithToast = useCallback(async (operation, loadingMessage, successMessage) => {
    const toast = showTaskToast(loadingMessage, successMessage);
    
    try {
      const result = await operation();
      toast.success();
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }, [showTaskToast]);

  const loadTasks = useCallback(async () => {
    if (!userId) {
      updateState({ tasks: [] });
      return;
    }

    try {
      updateState({ loading: true, error: null });
      const response = await taskService.findAllByUserId();
      updateState({ tasks: response.data || [] });
    } catch (error) {
      updateState({ 
        error: error.message || "Error cargando tareas", 
        tasks: [] 
      });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [userId, updateState]);

  const addTask = useCallback(async (taskData) => {
    return executeWithToast(
      async () => {
        const response = await taskService.create(taskData);
        setState(prev => ({ 
          ...prev, 
          tasks: [...prev.tasks, response.data] 
        }));
        return response;
      },
      'Agregando tarea...',
      'Tarea agregada'
    );
  }, [executeWithToast]);

  const updateTask = useCallback(async (taskData) => {
    return executeWithToast(
      async () => {
        const response = await taskService.update(taskData);
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === taskData.id ? { ...task, ...response.data } : task
          )
        }));
        return response;
      },
      'Actualizando tarea...',
      'Tarea actualizada'
    );
  }, [executeWithToast]);

  const deleteTask = useCallback(async (taskId) => {
    return executeWithToast(
      async () => {
        const response = await taskService.delete(taskId);
        setState(prev => ({ 
          ...prev, 
          tasks: prev.tasks.filter(task => task.id !== taskId) 
        }));
        return response;
      },
      'Eliminando tarea...',
      'Tarea eliminada'
    );
  }, [executeWithToast]);

  const toggleTaskCompletion = useCallback(async (taskId, isCompleted) => {
    const action = isCompleted ? 'Completando' : 'Marcando como pendiente';
    const successMessage = isCompleted ? 'Tarea completada' : 'Tarea marcada como pendiente';
    
    return executeWithToast(
      async () => {
        const response = await taskService.complete(taskId, isCompleted);
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === taskId ? { ...task, isCompleted } : task
          )
        }));
        return response;
      },
      `${action} tarea...`,
      successMessage
    );
  }, [executeWithToast]);

  useEffect(() => {
    if (userId) {
      loadTasks();
    }
  }, [loadTasks, userId]);

  return useMemo(() => ({
    ...state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks: loadTasks,
  }), [state, addTask, updateTask, deleteTask, toggleTaskCompletion, loadTasks]);
};