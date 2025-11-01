import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/common/Toast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser usado dentro de un ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [normalToasts, setNormalToasts] = useState([]);
  const [taskToasts, setTaskToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
    };

    setNormalToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setNormalToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);

    return id;
  }, []);

  const showTaskToast = useCallback((loadingMessage, successMessage) => {
    const id = Date.now() + Math.random();

    setTaskToasts((prev) => [
      ...prev,
      {
        id,
        message: loadingMessage,
        type: "loading",
      },
    ]);

    return {
      success: () => {
        setTaskToasts((prev) =>
          prev.map((toast) =>
            toast.id === id
              ? { ...toast, message: successMessage, type: "success" }
              : toast
          )
        );
        setTimeout(() => {
          setTaskToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 2000);
      },
      error: (errorMessage) => {
        setTaskToasts((prev) =>
          prev.map((toast) =>
            toast.id === id
              ? {
                  ...toast,
                  message: errorMessage || "Error en la operación",
                  type: "error",
                }
              : toast
          )
        );
        setTimeout(() => {
          setTaskToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
      },
      dismiss: () => {
        setTaskToasts((prev) => prev.filter((toast) => toast.id !== id));
      }
    };
  }, []);

  const value = {
    showToast,
    showTaskToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* toast to header */}
      <div className="normal-toast-container">
        {normalToasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setNormalToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>

      {/* toast to corner down */}
      <div className="task-toast-container">
        {taskToasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setTaskToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};