import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';

const LoadingSpinner = ({ message, subMessage, size = 'medium' }) => {
  const { message: contextMessage, subMessage: contextSubMessage } = useLoading();
  
  const displayMessage = message || contextMessage;
  const displaySubMessage = subMessage || contextSubMessage;

  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className={`spinner ${sizeClasses[size]}`}></div>
        <div className="loading-content">
          {displayMessage && <h3 className="loading-message">{displayMessage}</h3>}
          {displaySubMessage && <p className="loading-submessage">{displaySubMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;