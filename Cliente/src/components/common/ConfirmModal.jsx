import React from 'react';
import '../../styles/components/confirm-modal.css';

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
  loading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'confirm-btn confirm-btn-primary';
      case 'success':
        return 'confirm-btn confirm-btn-success';
      default:
        return 'confirm-btn confirm-btn-primary';
    }
  };

  return (
    <div className="confirm-modal-overlay" style={{ display: 'flex' }}>
      <div className="confirm-modal-container">
        <div className="confirm-modal-header">
          <h2 className={`confirm-${type}`}>
            <span className="confirm-icon">{getIcon()}</span>
            {title}
          </h2>
          <button className="confirm-close-btn" onClick={onClose} disabled={loading}>×</button>
        </div>

        <div className="confirm-modal-content">
          <div className="confirm-message">
            {message}
          </div>
          
          {details && (
            <div className="confirm-details">
              {details}
            </div>
          )}

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
              {loading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;