import React from 'react';

const UserModalTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'profile', label: 'Perfil' },
    { id: 'password', label: 'Contraseña' },
    { id: 'sessions', label: 'Sesiones' },
    { id: 'danger', label: 'Eliminar Cuenta' }
  ];

  return (
    <div className="user-modal-tabs-container">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`user-tab-btn ${activeTab === tab.id ? 'user-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default UserModalTabs;