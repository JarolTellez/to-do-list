import React, { useState, useMemo } from "react";
import Sidebar from "../../components/tasks/Sidebar";
import TaskList from "../../components/tasks/TaskList";
import TaskModal from "../../components/tasks/TaskModal";
import UserModal from "../../components/user/UserModal";
import { useToast } from "../../contexts/ToastContexts";
import { useTasks } from "../../hooks/useTasks";
import { useFilters } from "../../hooks/useFilters";
import { useLoading } from "../../contexts/LoadingContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import { APP_CONFIG } from "../../utils/constants/appConstants";

const Principal = ({ user, onLogout }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    details: null,
    confirmText: "Confirmar",
    onConfirm: null,
  });

  const { showToast } = useToast();
  const { startFullScreenLoading, stopFullScreenLoading } = useLoading();

  const userId = user?.id;

  const {
    tasks,
    loading: tasksLoading,
    loadingMore: tasksLoadingMore,
    error,
    hasMore,
    totalTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks,
    loadMoreTasks,
  } = useTasks(userId);

  const {
    filter,
    priorityFilter,
    dateFilter,
    setFilter,
    setPriorityFilter,
    setDateFilter,
    applyFilters,
    clearAll,
    hasActiveFilters,
  } = useFilters();

  const stats = useMemo(() => {
    const now = new Date();
    const completed = tasks.filter((task) => task.isCompleted).length;
    const pending = tasks.filter((task) => !task.isCompleted).length;
    const overdue = tasks.filter(
      (task) =>
        !task.isCompleted &&
        task.scheduledDate &&
        new Date(task.scheduledDate) < now
    ).length;

    return {
      total: totalTasks,
      completed,
      pending,
      overdue,
    };
  }, [tasks, totalTasks]);

  const filteredTasks = useMemo(() => {
    return applyFilters(tasks);
  }, [tasks, applyFilters]);

  const showConfirmModal = (config) => {
    setConfirmModal({
      isOpen: true,
      type: config.type || "warning",
      title: config.title,
      message: config.message,
      details: config.details,
      confirmText: config.confirmText || "Confirmar",
      onConfirm: config.onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAddTask = async (taskData) => {
    try {
      await addTask(taskData);
      setShowModal(false);
    } catch (error) {
       // Error already handled by useTasks
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      await updateTask(taskData);
      setShowModal(false);
      setEditingTask(null);
    } catch (error) {
       // Error already handled by useTasks
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
       // Error already handled by useTasks
    }
  };

  const handleToggleComplete = async (taskId, isCompleted) => {
    try {
      await toggleTaskCompletion(taskId, isCompleted);
    } catch (error) {
       // Error already handled by useTasks
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshTasks();
    } catch (error) {
       // Error already handled by useTasks
    }
  };

  const handleLogout = () => {
    showConfirmModal({
      type: "warning",
      title: "Cerrar Sesión",
      message: "¿Estás seguro de que quieres cerrar la sesión actual?",
      details: (
        <ul>
          <li>Serás redirigido a la página de login</li>
        </ul>
      ),
      confirmText: "Cerrar Sesión",
      onConfirm: async () => {
        closeConfirmModal();
        startFullScreenLoading("Cerrando sesión", "Hasta pronto...");

        try {
          await onLogout();
          showToast("Sesión cerrada exitosamente", "success");
        } catch (error) {
          console.error("Error durante logout:", error);
          showToast("Sesión cerrada", "success");
        } finally {
          setTimeout(() => {
            stopFullScreenLoading();
          }, 1000);
        }
      },
    });
  };

  const openAddModal = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const openUserModal = () => {
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
  };

  if (tasksLoading && tasks.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tareas...</p>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="error-container">
        <h2>Error al cargar las tareas</h2>
        <p>{error.message || "Error desconocido"}</p>
        <button onClick={handleRefresh} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="todo-app">
      <header className="app-header">
        <div className="header-content">
          <h1>{APP_CONFIG.NAME}</h1>
          <div className="user-actions">
            <span>Hola, {user?.username}</span>
            <button onClick={openUserModal} className="user-info-btn">
              👤
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="app-content">
        <Sidebar
          stats={stats}
          filter={filter}
          priorityFilter={priorityFilter}
          dateFilter={dateFilter}
          onFilterChange={setFilter}
          onPriorityFilterChange={setPriorityFilter}
          onDateFilterChange={setDateFilter}
          onRefresh={handleRefresh}
          onClearAll={clearAll}
          hasActiveFilters={hasActiveFilters}
        />

        <main className="main-content">
          <div className="content-header">
            <div className="header-left">
              <button onClick={openAddModal} className="add-task-btn">
                + Nueva Tarea
              </button>
              <span className="task-count">
                {totalTasks}{" "}
                {totalTasks === 1 ? "tarea" : "tareas"}
                {hasActiveFilters && " (filtradas)"}
                {tasksLoadingMore && " - Cargando..."}
              </span>
            </div>
          </div>

          <TaskList
            tasks={filteredTasks}
            onEditTask={openEditModal}
            onDeleteTask={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
            onLoadMore={loadMoreTasks}
            loading={tasksLoading}
            loadingMore={tasksLoadingMore}
            hasMore={hasMore}
            emptyMessage={
              tasks.length === 0
                ? "No hay tareas creadas. ¡Agrega tu primera tarea!"
                : "No hay tareas que coincidan con los filtros aplicados."
            }
          />
        </main>
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          onSave={editingTask ? handleEditTask : handleAddTask}
          onClose={closeModal}
          onDelete={handleDeleteTask}
          isEditing={!!editingTask}
        />
      )}

      {showUserModal && (
        <UserModal user={user} onClose={closeUserModal} onLogout={onLogout} />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />
    </div>
  );
};

export default Principal;