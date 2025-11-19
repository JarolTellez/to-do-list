import React from "react";
import { FaExclamationTriangle, FaCheck, FaInfo } from "react-icons/fa";
import "../../styles/components/common/confirmModal.css";

/**
 * Reusable confirmation modal component
 * @component ConfirmModal
 * @description Displays confirmation dialogs with customizable content and actions
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onConfirm - Callback when confirmation is accepted
 * @param {string} props.title - Modal title text
 * @param {string} props.message - Main message content
 * @param {ReactNode} props.details - Additional details or components
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 * @param {string} props.type - Modal type (warning, danger, success, info)
 * @param {boolean} props.loading - Loading state for buttons
 * @returns {JSX.Element} Confirmation modal interface
 */
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

  /**
   * Gets appropriate icon based on modal type
   * @function getIcon
   * @returns {JSX.Element} Icon component
   */
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

  /**
   * Gets CSS class for confirm button based on modal type
   * @function getConfirmButtonClass
   * @returns {string} CSS class name
   */
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
