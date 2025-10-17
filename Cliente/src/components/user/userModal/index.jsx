import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContexts';
import UserModalTabs from '../UserModalTabs';
import UserProfileTab from './UserProfileTab';
import ChangePasswordTab from './ChangePasswordTab';
import SessionsTab from './SessionsTab';
import DangerZoneTab from './DeleteAccountTab';
import ConfirmModal from '../../common/ConfirmModal';
import FullScreenLoader from '../../common/FullScreenLoader';

const UserModal = ({ user, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullScreenLoading, setFullScreenLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    details: null,
    confirmText: 'Confirmar',
    onConfirm: null
  });
  
  const { showToast } = useToast();

  const startFullScreenLoad = (message, subMessage = "Por favor, espera") => {
    setLoadingMessage(message);
    setLoadingSubMessage(subMessage);
    setFullScreenLoading(true);
  };

  const stopFullScreenLoad = () => {
    setFullScreenLoading(false);
    setLoadingMessage('');
    setLoadingSubMessage('');
  };

  const showConfirmModal = (config) => {
    setConfirmModal({
      isOpen: true,
      type: config.type || 'warning',
      title: config.title,
      message: config.message,
      details: config.details,
      confirmText: config.confirmText || 'Confirmar',
      onConfirm: config.onConfirm
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const renderTabContent = () => {
    const commonProps = {
      user,
      onLogout,
      showToast,
      showConfirmModal,
      startFullScreenLoad,
      stopFullScreenLoad,
      setLoadingMessage,
      setLoadingSubMessage  
    };

    switch (activeTab) {
      case 'profile':
        return <UserProfileTab {...commonProps} />;
      case 'password':
        return <ChangePasswordTab {...commonProps} />;
      case 'sessions':
        return <SessionsTab {...commonProps} />;
      case 'danger':
        return <DangerZoneTab {...commonProps} />;
      default:
        return <UserProfileTab {...commonProps} />;
    }
  };

  const handleLogout = () => {
    showConfirmModal({
      type: 'warning',
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar la sesión actual?',
      details: (
        <ul>
          <li>Serás redirigido a la página de login</li>
        </ul>
      ),
      confirmText: 'Cerrar Sesión',
      onConfirm: () => {
        closeConfirmModal();
        startFullScreenLoad("Cerrando sesión", "Hasta pronto...");
        setTimeout(() => {
          onLogout();
        }, 1500);
      }
    });
  };

  return (
    <>
      {fullScreenLoading && (
        <FullScreenLoader 
          message={loadingMessage}
          subMessage={loadingSubMessage}
        />
      )}

      {!fullScreenLoading && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content user-modal-content-wrapper">
            <div className="user-modal-header">
              <h2>Configuración de Usuario</h2>
              <button className="user-modal-close-btn" onClick={onClose}>×</button>
            </div>

            <UserModalTabs 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />

            <div className="user-modal-main-content">
              {renderTabContent()}
            </div>

            <div className="user-modal-actions">
              <button className="user-modal-close-button" onClick={onClose}>
                Cerrar
              </button>
              <button className="user-modal-logout-btn" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />
    </>
  );
};

export default UserModal;