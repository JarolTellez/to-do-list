import { useState, useEffect, useCallback } from "react";
import {
  findAllTasksByUserId,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
} from "../services/tasks";

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      return;
    }

    try {
      setInitialLoading(true);
      setError(null);
      const response = await findAllTasksByUserId();
      setTasks(response.data || []);
    } catch (error) {
      setError(error.message || "Error cargando tareas");
      setTasks([]);
      throw error;
    } finally {
      setInitialLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTasks();
    }
  }, [loadTasks, userId]);

  const addTask = useCallback(async (taskData) => {
    try {
      setOperationLoading(true);
      setError(null);
      const response = await createTask(taskData);
      setTasks((prev) => [...prev, response.data]);
      return response;
    } catch (error) {
      setError(error.message || "Error agregando tarea");
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  const updateTaskItem = useCallback(async (taskData) => {
    try {
      setOperationLoading(true);
      setError(null);
      const response = await updateTask(taskData);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskData.id ? { ...task, ...response.data } : task
        )
      );
      return response;
    } catch (error) {
      setError(error.message || "Error actualizando tarea");
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  const deleteTaskItem = useCallback(async (taskId) => {
    try {
      setOperationLoading(true);
      setError(null);

      const response = await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      return response;
    } catch (error) {
      setError(error.message || "Error eliminando tarea");
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  const toggleTaskCompletion = useCallback(async (taskId, isCompleted) => {
    try {
      setOperationLoading(true);
      setError(null);

      const response = await completeTask(taskId, isCompleted);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isCompleted } : task
        )
      );
      return response;
    } catch (error) {
      setError(error.message || "Error completando tarea");
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  return {
    tasks,
    loading: initialLoading,
    operationLoading,
    error,
    addTask,
    updateTask: updateTaskItem,
    deleteTask: deleteTaskItem,
    toggleTaskCompletion,
    refreshTasks: loadTasks,
  };
};
