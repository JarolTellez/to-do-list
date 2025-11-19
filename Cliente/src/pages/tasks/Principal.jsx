import React, { useState, useMemo, useCallback, useEffect } from "react";
import Sidebar from "../../components/tasks/SideBar";
import TaskList from "../../components/tasks/TaskList";
import TaskModal from "../../components/tasks/TaskModal";
import UserModal from "../../components/user/userModal/index";
import { useToast } from "../../contexts/ToastContexts";
import { useTasks } from "../../hooks/useTasks";
import { useFilters } from "../../hooks/useFilters";
import { useLoading } from "../../contexts/LoadingContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import { APP_CONFIG } from "../../utils/constants/appConstants";
import {
  FaUserCircle,
  FaBars,
  FaPlus,
  FaTasks,
  FaListAlt,
  FaClipboardList,
  FaStickyNote,
} from "react-icons/fa";

/**
 * Main application page with task management
 * @component Principal
 * @description Primary interface for task management with sidebar and modals
 * @param {Object} props - Component properties
 * @param {Object} props.user - Current user data
 * @param {Function} props.onLogout - Logout callback function
 * @returns {JSX.Element} Main application interface
 */
const Principal = ({ user, onLogout }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
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
    completedCount,
    pendingCount,
    overdueCount,
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

  // Efecto para manejar el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showModal || showUserModal || isSidebarMobileOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showModal, showUserModal, isSidebarMobileOpen]);

  const stats = useMemo(() => {
    return {
      total: totalTasks,
      completedCount,
      pendingCount,
      overdueCount,
    };
  }, [totalTasks, completedCount, pendingCount, overdueCount]);

  const filteredTasks = useMemo(() => {
    return applyFilters(tasks);
  }, [tasks, applyFilters]);

  const showConfirmModal = useCallback((config) => {
    setConfirmModal({
      isOpen: true,
      type: config.type || "warning",
      title: config.title,
      message: config.message,
      details: config.details,
      confirmText: config.confirmText || "Confirmar",
      onConfirm: config.onConfirm,
    });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Handles task addition
   * @async
   * @function handleAddTask
   * @param {Object} taskData - Task data to add
   * @returns {Promise<void>}
   */
  const handleAddTask = useCallback(
    async (taskData) => {
      try {
        await addTask(taskData);
        setShowModal(false);
      } catch (error) {}
    },
    [addTask]
  );

  /**
   * Handles task editing
   * @async
   * @function handleEditTask
   * @param {Object} taskData - Updated task data
   * @returns {Promise<void>}
   */
  const handleEditTask = useCallback(
    async (taskData) => {
      try {
        await updateTask(taskData);
        setShowModal(false);
        setEditingTask(null);
      } catch (error) {}
    },
    [updateTask]
  );

  /**
   * Handles task deletion
   * @async
   * @function handleDeleteTask
   * @param {string} taskId - Task ID to delete
   * @returns {Promise<void>}
   */
  const handleDeleteTask = useCallback(
    async (taskId) => {
      try {
        await deleteTask(taskId);
      } catch (error) {}
    },
    [deleteTask]
  );

  /**
   * Handles task completion toggle
   * @async
   * @function handleToggleComplete
   * @param {string} taskId - Task ID to toggle
   * @param {boolean} isCompleted - New completion status
   * @returns {Promise<void>}
   */
  const handleToggleComplete = useCallback(
    async (taskId, isCompleted) => {
      try {
        await toggleTaskCompletion(taskId, isCompleted);
      } catch (error) {}
    },
    [toggleTaskCompletion]
  );

  /**
   * Refreshes tasks data
   * @async
   * @function handleRefresh
   * @returns {Promise<void>}
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refreshTasks();
      if (isSidebarMobileOpen) {
        setIsSidebarMobileOpen(false);
      }
    } catch (error) {}
  }, [refreshTasks, isSidebarMobileOpen]);

  /**
   * Clears all active filters
   * @function handleClearAll
   */
  const handleClearAll = useCallback(() => {
    clearAll();
    if (isSidebarMobileOpen) {
      setIsSidebarMobileOpen(false);
    }
  }, [clearAll, isSidebarMobileOpen]);

  /**
   * Handles user logout with confirmation
   * @function handleLogout
   */
  const handleLogout = useCallback(() => {
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
        } catch (error) {
          showToast("Sesión cerrada", "success");
        } finally {
          setTimeout(() => {
            stopFullScreenLoading();
          }, 1000);
        }
      },
    });
  }, [
    showConfirmModal,
    closeConfirmModal,
    startFullScreenLoading,
    onLogout,
    showToast,
    stopFullScreenLoading,
  ]);

  /**
   * Opens task creation modal
   * @function openAddModal
   */
  const openAddModal = useCallback(() => {
    setEditingTask(null);
    setShowModal(true);
  }, []);

  /**
   * Opens task editing modal
   * @function openEditModal
   * @param {Object} task - Task to edit
   */
  const openEditModal = useCallback((task) => {
    setEditingTask(task);
    setShowModal(true);
  }, []);

  /**
   * Closes task modal
   * @function closeModal
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingTask(null);
  }, []);

  /**
   * Opens user settings modal
   * @function openUserModal
   */
  const openUserModal = useCallback(() => {
    setShowUserModal(true);
  }, []);

  /**
   * Closes user settings modal
   * @function closeUserModal
   */
  const closeUserModal = useCallback(() => {
    setShowUserModal(false);
  }, []);

  /**
   * Toggles mobile sidebar visibility
   * @function toggleSidebarMobile
   */
  const toggleSidebarMobile = useCallback(() => {
    setIsSidebarMobileOpen(!isSidebarMobileOpen);
  }, [isSidebarMobileOpen]);

  /**
   * Closes mobile sidebar
   * @function closeSidebarMobile
   */
  const closeSidebarMobile = useCallback(() => {
    setIsSidebarMobileOpen(false);
  }, []);

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
              <FaUserCircle size={24} color="#4A5568" />
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
          onClearAll={handleClearAll}
          hasActiveFilters={hasActiveFilters}
          isMobileOpen={isSidebarMobileOpen}
          onMobileClose={closeSidebarMobile}
        />

        <main className="main-content">
          <div className="content-header">
            <div className="header-left">
              <button onClick={openAddModal} className="add-task-btn">
                <FaPlus /> Nueva Tarea
              </button>
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

        {/* side bar button mobile */}
        <button
          className="sidebar-toggle"
          onClick={toggleSidebarMobile}
          aria-label="Abrir menú de filtros"
        >
          <FaBars />
        </button>
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
