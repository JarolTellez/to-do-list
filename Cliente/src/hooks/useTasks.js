import { useState, useEffect } from "react";
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

  const loadTasks = async (options = {}) => {
    if (!userId) {
      setTasks([]);
      return;
    }

    try {
      setInitialLoading(true);
      setError(null);
      const tasksData = await findAllTasksByUserId(userId, options);
      setTasks(tasksData || []);
    } catch (err) {
      console.error("Erroruploading tasks:", err);
      setError(err.message);
      setTasks([]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [userId]);

  const addTask = async (taskData) => {
    try {
      setOperationLoading(true);
      const newTask = await createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return true;
    } catch (err) {
      console.error("Error adding task:", err);
      setError(err.message);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const updateTaskItem = async (taskData) => {
    try {
      setOperationLoading(true);
      const updatedTask = await updateTask(taskData);
      setTasks(prev => 
        prev.map(task => 
          task.id === taskData.id ? { ...task, ...updatedTask } : task
        )
      );
      return true;
    } catch (err) {
      console.error("Error updating task:", err);
      setError(err.message);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const deleteTaskItem = async (taskId) => {
    try {
      setOperationLoading(true);
      await deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(err.message);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId, isCompleted) => {
    try {
      setOperationLoading(true);
      await completeTask(taskId, isCompleted);
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, isCompleted } : task
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

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