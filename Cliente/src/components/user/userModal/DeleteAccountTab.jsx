import React, { useState } from 'react';
import { deleteUserAccount } from '../../../services/user';

const DeleteAccountTab = ({ showToast, startFullScreenLoad, stopFullScreenLoad, showConfirmModal,setLoadingMessage,
  setLoadingSubMessage  }) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = () => {
    showConfirmModal({
      type: 'danger',
      title: 'Eliminar Cuenta',
      message: '¿ESTÁS ABSOLUTAMENTE SEGURO?',
      details: (
        <div>
          <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#dc3545' }}>
            ⚠️ ESTA ACCIÓN ES IRREVERSIBLE ⚠️
          </p>
          <ul>
            <li>🗑️ Tu cuenta y todos tus datos serán eliminados</li>
            <li>🗑️ Todas tus tareas y configuraciones se perderán</li>
            <li>🗑️ Tu historial de sesiones será borrado</li>
            <li>🚫 Perderás el acceso permanentemente</li>
          </ul>
        </div>
      ),
      confirmText: 'ELIMINAR CUENTA',
      onConfirm: async () => {
        startFullScreenLoad("Eliminando cuenta", "Esta acción es irreversible. Por favor, espera...");
        
        try {
          const result = await deleteUserAccount();
          if (result.success) {
            setLoadingMessage("Cuenta eliminada correctamente");
            setLoadingSubMessage("Redirigiendo al login");
            
            localStorage.setItem('accountDeletedMessage', 'true');
            
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            
          } else {
            setLoadingMessage("Error al eliminar cuenta");
            setLoadingSubMessage(result.error);
            
            setTimeout(() => {
              stopFullScreenLoad();
              showToast(result.error, 'error', 6000);
            }, 3000);
          }
        } catch (error) {
          setLoadingMessage("❌ Error inesperado");
          setLoadingSubMessage("Por favor, intenta nuevamente");
          
          setTimeout(() => {
            stopFullScreenLoad();
            showToast('Error eliminando cuenta', 'error', 5000);
          }, 3000);
        }
      }
    });
  };

  return (
    <div className="tab-content">
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
          disabled={loading}
          style={{ 
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '🔄 Procesando...' : '🗑️ ELIMINAR CUENTA'}
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountTab;