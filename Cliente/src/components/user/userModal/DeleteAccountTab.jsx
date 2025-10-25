import React from 'react';

const DeleteAccountTab = ({ onDeleteAccount }) => {
  const handleDeleteAccount = () => {
    onDeleteAccount();
  };

  return (
    <div className="user-tab-content">
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3 style={{ color: '#dc3545', marginBottom: '20px' }}>Eliminar Cuenta</h3>
        
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#856404', marginBottom: '15px' }}>⚠️ Advertencia Crítica</h4>
          <p style={{ color: '#856404', marginBottom: '10px' }}>
            Esta acción <strong>NO SE PUEDE DESHACER</strong>
          </p>
          <ul style={{ textAlign: 'left', color: '#856404', marginBottom: '15px' }}>
            <li>Tu cuenta y todos los datos serán eliminados permanentemente</li>
            <li>Perderás el acceso a la aplicación</li>
            <li>No podrás recuperar tu información</li>
          </ul>
        </div>
        
        <button 
          className="btn-danger"
          onClick={handleDeleteAccount}
          style={{ 
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          🗑️ ELIMINAR CUENTA
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountTab;