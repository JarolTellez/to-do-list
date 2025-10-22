import React, { useState, useMemo } from "react";
import Sidebar from "../../components/tasks/Sidebar";
import TaskList from "../../components/tasks/TaskList";
import TaskModal from "../../components/tasks/TaskModal";
import UserModal from "../../components/user/userModal/index";
import { useToast } from "../../components/contexts/ToastContexts";
import { useTasks } from "../../hooks/useTasks";
import { useFilters } from "../../hooks/useFilters";
import FullScreenLoader from "../../components/common/FullScreenLoader";
import ConfirmModal from "../../components/common/ConfirmModal";

const Principal = ({ user, onLogout }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [fullScreenLoading, setFullScreenLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingSubMessage, setLoadingSubMessage] = useState("");
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

  const userId = user?.id;

  const {
    tasks,
    loading,
    operationLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks,
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
      total: tasks.length,
      completed,
      pending,
      overdue,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return applyFilters(tasks);
  }, [tasks, applyFilters]);

  const startFullScreenLoad = (message, subMessage = "Por favor, espera") => {
    setLoadingMessage(message);
    setLoadingSubMessage(subMessage);
    setFullScreenLoading(true);
  };

  // const stopFullScreenLoad = () => {
  //   setFullScreenLoading(false);
  //   setLoadingMessage("");
  //   setLoadingSubMessage("");
  // };

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

  const getErrorMessage = (error) => {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error en la operación"
    );
  };

  const handleAddTask = async (taskData) => {
    try {
      const response = await addTask(taskData);
      setShowModal(false);
      showToast(response.message || "Tarea agregada", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error", 6000);
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      const response = await updateTask(taskData);
      setShowModal(false);
      setEditingTask(null);
      showToast(response.message || "Tarea actualizada", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error", 6000);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      showToast("Tarea eliminada", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error", 6000);
    }
  };

  const handleToggleComplete = async (taskId, isCompleted) => {
    try {
      await toggleTaskCompletion(taskId, isCompleted);
      const action = isCompleted ? "completada" : "marcada como pendiente";
      showToast(`Tarea ${action}`, "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error", 6000);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshTasks();
      showToast("Tareas actualizadas", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error", 6000);
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
      onConfirm: () => {
        closeConfirmModal();
        startFullScreenLoad("Cerrando sesión", "Hasta pronto...");
        setTimeout(() => {
          onLogout();
        }, 1500);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tareas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error al cargar las tareas</h2>
        <p>{getErrorMessage(error)}</p>
        <button onClick={handleRefresh}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="todo-app">
      {/* FullScreenLoader para logout */}
      {fullScreenLoading && (
        <FullScreenLoader
          message={loadingMessage}
          subMessage={loadingSubMessage}
        />
      )}

      <header className="app-header">
        <div className="header-content">
          <h1>Todo App</h1>
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
                {filteredTasks.length}{" "}
                {filteredTasks.length === 1 ? "tarea" : "tareas"}
                {hasActiveFilters && " (filtradas)"}
              </span>
            </div>
          </div>

          <TaskList
            tasks={filteredTasks}
            onEditTask={openEditModal}
            onDeleteTask={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
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
          loading={operationLoading}
        />
      )}

      {showUserModal && (
        <UserModal user={user} onClose={closeUserModal} onLogout={onLogout} />
      )}

      {/* ConfirmModal para logout */}
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
