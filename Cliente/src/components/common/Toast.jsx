import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
      default:
        return '#007bff';
    }
  };

  return (
    <div 
      className="toast mostrar"
      style={{ 
        background: getBackgroundColor(),
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1001,
        padding: '15px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '400px',
        wordWrap: 'break-word'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
        <span>{message}</span>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;