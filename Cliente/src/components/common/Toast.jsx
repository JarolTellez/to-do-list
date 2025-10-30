import React from "react";
import '../../styles/components/common/toast.css';

const Toast = ({ message, type = "info", onClose }) => {
  return (
    <div className={`toast ${type} mostrar`}>
      <div className="toast-content">
        <span>{message}</span>
        <button className="toast-close-btn" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
