import React from "react";
import { useLoading } from "../../contexts/LoadingContext";
import "../../styles/components/common/loadingSpinner.css";

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
