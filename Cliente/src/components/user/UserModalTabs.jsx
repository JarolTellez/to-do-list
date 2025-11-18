import React from "react";

/**
 * Tab navigation component for user modal
 * @component UserModalTabs
 * @description Provides tab-based navigation for user settings
 * @param {Object} props - Component properties
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onTabChange - Tab change callback
 * @returns {JSX.Element} Tab navigation interface
 */
const UserModalTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "profile", label: "Perfil" },
    { id: "password", label: "Contraseña" },
    { id: "sessions", label: "Sesiones" },
    { id: "danger", label: "Eliminar Cuenta" },
  ];

  return (
    <div className="user-modal-tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`user-tab-btn ${
            activeTab === tab.id ? "user-tab-active" : ""
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default UserModalTabs;
