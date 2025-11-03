import React from "react";
import { FaExclamationTriangle, FaCheck, FaInfo } from "react-icons/fa";
import "../../styles/components/common/confirmModal.css";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
  loading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <FaExclamationTriangle className="confirm-icon" />;
      case "success":
        return <FaCheck className="confirm-icon" />;
      case "info":
        return <FaInfo className="confirm-icon" />;
      default:
        return <FaExclamationTriangle className="confirm-icon" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "confirm-btn confirm-btn-primary";
      case "success":
        return "confirm-btn confirm-btn-success";
      default:
        return "confirm-btn confirm-btn-primary";
    }
  };

  return (
    <div className="confirm-modal-overlay flex-display">
      <div className="confirm-modal-container">
        <div className="confirm-modal-header">
          <h2 className={`confirm-${type}`}>
            <span className="confirm-icon">{getIcon()}</span>
            {title}
          </h2>
          <button
            className="confirm-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="confirm-modal-content">
          <div className="confirm-message">{message}</div>

          {details && <div className="confirm-details">{details}</div>}

          <div className="confirm-actions">
            <button
              className="confirm-btn confirm-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              className={getConfirmButtonClass()}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Procesando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
