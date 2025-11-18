import React from "react";
import { useLoading } from "../../contexts/LoadingContext";
import "../../styles/components/common/loadingSpinner.css";

/**
 * Reusable loading spinner component
 * @component LoadingSpinner
 * @description Displays loading spinner in various sizes and configurations
 * @param {Object} props - Component properties
 * @param {string} props.message - Loading message text
 * @param {string} props.subMessage - Secondary message text
 * @param {string} props.size - Spinner size (small, medium, large)
 * @param {boolean} props.inline - Whether to display inline
 * @returns {JSX.Element} Loading spinner component
 */
const LoadingSpinner = ({
  message,
  subMessage,
  size = "medium",
  inline = false,
}) => {
  const { message: contextMessage, subMessage: contextSubMessage } =
    useLoading();

  const displayMessage = message || contextMessage;
  const displaySubMessage = subMessage || contextSubMessage;

  const sizeClasses = {
    small: "spinner-small",
    medium: "spinner-medium",
    large: "spinner-large",
  };

  if (inline) {
    return (
      <div className="inline-loading">
        <div className={`spinner ${sizeClasses[size]} inline-spinner`}></div>
        {displayMessage && (
          <span className="loading-message">{displayMessage}</span>
        )}
      </div>
    );
  }

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className={`spinner ${sizeClasses[size]}`}></div>
        <div className="loading-content">
          {displayMessage && (
            <h3 className="loading-message">{displayMessage}</h3>
          )}
          {displaySubMessage && (
            <p className="loading-submessage">{displaySubMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
