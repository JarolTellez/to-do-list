import React from "react";
import { FaExclamationTriangle, FaTrash } from "react-icons/fa";

/**
 * Account deletion tab component
 * @component DeleteAccountTab
 * @description Handles account deletion with warning messages
 * @param {Object} props - Component properties
 * @param {Function} props.onDeleteAccount - Account deletion callback
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Account deletion interface
 */
const DeleteAccountTab = ({ onDeleteAccount, loading }) => {
  /**
   * Initiates account deletion process
   * @function handleDeleteAccount
   */
  const handleDeleteAccount = () => {
    onDeleteAccount();
  };

  return (
    <div className="user-tab-content">
      <div className="delete-account-container">
        <h3 className="delete-account-title">Eliminar Cuenta</h3>

        <div className="delete-account-warning-box">
          <h4 className="delete-account-warning-title">
            {" "}
            <FaExclamationTriangle /> Advertencia Crítica
          </h4>
          <p className="delete-account-warning-text">
            Esta acción <strong>NO SE PUEDE DESHACER</strong>
          </p>
          <ul className="delete-account-list">
            <li>
              Tu cuenta y todos los datos serán eliminados permanentemente
            </li>
            <li>Perderás el acceso a la aplicación</li>
            <li>No podrás recuperar tu información</li>
          </ul>
        </div>

        <button
          className="user-btn-danger delete-account-btn"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? "Eliminando..." : " ELIMINAR CUENTA"}
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountTab;
