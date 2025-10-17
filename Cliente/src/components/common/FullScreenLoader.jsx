import React from 'react';
import '../../styles/components/full-screen-loader.css';

const FullScreenLoader = ({ 
  message = "Procesando...", 
  subMessage = "Por favor, espera" 
}) => {
  return (
    <div className="full-screen-loader">
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <div className="loader-content">
          <h3 className="loader-message">{message}</h3>
          <p className="loader-submessage">{subMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;