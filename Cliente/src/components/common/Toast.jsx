import React from "react";
import "../../styles/components/common/toast.css";

/**
 * Toast notification component
 * @component Toast
 * @description Displays temporary notification messages
 * @param {Object} props - Component properties
 * @param {string} props.message - Toast message content
 * @param {string} props.type - Toast type (info, success, error, warning)
 * @param {Function} props.onClose - Callback when toast is closed
 * @returns {JSX.Element} Toast notification
 */
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
