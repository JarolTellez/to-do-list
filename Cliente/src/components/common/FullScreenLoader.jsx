import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';
import '../../styles/components/full-screen-loader.css';

const FullScreenLoader = ({ 
  message, 
  subMessage 
}) => {
  const { 
    isFullScreenLoading, 
    fullScreenMessage, 
    fullScreenSubMessage 
  } = useLoading();

  if (!isFullScreenLoading) return null;

  const displayMessage = message || fullScreenMessage;
  const displaySubMessage = subMessage || fullScreenSubMessage;

  return (
    <div className="full-screen-loader">
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <div className="loader-content">
          <h3 className="loader-message">{displayMessage}</h3>
          <p className="loader-submessage">{displaySubMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;