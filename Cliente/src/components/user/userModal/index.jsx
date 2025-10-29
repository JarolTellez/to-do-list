import React, { useState } from "react";
import { useToast } from "../../../contexts/ToastContexts";
import { useLoading } from "../../../contexts/LoadingContext";
import { useUser } from "../../../hooks/useUser";
import { useSessions } from "../../../hooks/useSessions";
import UserModalTabs from "../UserModalTabs";
import UserProfileTab from "./UserProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";
import SessionsTab from "./SessionsTab";
import DangerZoneTab from "./DeleteAccountTab";
import ConfirmModal from "../../common/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../contexts/AuthContext";

const UserModal = ({ user, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    details: null,
    confirmText: "Confirmar",
    onConfirm: null,
  });

  const { showToast } = useToast();
  const { startFullScreenLoading, stopFullScreenLoading } = useLoading();

  const {
    updateProfile,
    updatePassword,
    deleteAccount,
    loading: userLoading,
  } = useUser();

  const { closeAllSessions } = useSessions();
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuthContext();

  const showConfirmModal = (config) => {
    setConfirmModal({
      isOpen: true,
      type: config.type || "warning",
      title: config.title,
      message: config.message,
      details: config.details,
      confirmText: config.confirmText || "Confirmar",
      onConfirm: config.onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleLogout = () => {
    showConfirmModal({
      type: "warning",
      title: "Cerrar Sesión",
      message: "¿Estás seguro de que quieres cerrar la sesión actual?",
      details: (
        <ul>
          <li>Serás redirigido a la página de login</li>
        </ul>
      ),
      confirmText: "Cerrar Sesión",
      onConfirm: async () => {
        closeConfirmModal();
        startFullScreenLoading("Cerrando sesión", "Hasta pronto...");

        try {
          await onLogout();
          showToast("Sesión cerrada exitosamente", "success");
        } catch (error) {
          console.error("Error durante logout:", error);
          showToast("Sesión cerrada", "success");
        } finally {
          setTimeout(() => {
            stopFullScreenLoading();
          }, 1000);
        }
      },
    });
  };

  const handleUpdateProfile = async (profileData) => {
    showConfirmModal({
      type: "warning",
      title: "Actualizar Perfil",
      message: "¿Estás seguro de que quieres actualizar tu perfil?",
      details: (
        <ul>
          <li>
            Tu nombre de usuario cambiará a:{" "}
            <strong>{profileData.username}</strong>
          </li>
          <li>
            Tu email cambiará a: <strong>{profileData.email}</strong>
          </li>
          <li>
            Después de actualizar, la sesión se cerrará automáticamente por
            seguridad
          </li>
        </ul>
      ),
      confirmText: "Actualizar Perfil",
      onConfirm: async () => {
        closeConfirmModal();
        startFullScreenLoading("Actualizando perfil", "Procesando cambios...");

        try {
          const response = await updateProfile(profileData);
          showToast(
            response.message || "Perfil actualizado exitosamente",
            "success"
          );

          startFullScreenLoading(
            "Perfil actualizado",
            "Cerrando sesión por seguridad..."
          );
          setTimeout(() => {
            onLogout();
            stopFullScreenLoading();
          }, 1500);
        } catch (error) {
          showToast(
            error.message || "Error al actualizar el perfil",
            "error",
            6000
          );
          stopFullScreenLoading();
        }
      },
    });
  };

  const handleUpdatePassword = async (passwordData) => {
    showConfirmModal({
      type: "warning",
      title: "Cambiar Contraseña",
      message: "¿Estás seguro de que quieres cambiar tu contraseña?",
      details: (
        <ul>
          <li>Tu contraseña será actualizada</li>
          <li>
            Deberás usar tu nueva contraseña para futuros inicios de sesión
          </li>
          <li>La sesión se cerrará automáticamente por seguridad</li>
        </ul>
      ),
      confirmText: "Cambiar Contraseña",
      onConfirm: async () => {
        closeConfirmModal();
        startFullScreenLoading(
          "Cambiando contraseña",
          "Actualizando tu seguridad..."
        );

        try {
          const response = await updatePassword(passwordData);
          showToast(
            response.message || "Contraseña actualizada exitosamente",
            "success"
          );

          startFullScreenLoading(
            "Contraseña actualizada",
            "Cerrando sesión por seguridad..."
          );
          setTimeout(() => {
            onLogout();
            stopFullScreenLoading();
          }, 1500);
        } catch (error) {
          showToast(
            error.message || "Error al cambiar la contraseña",
            "error",
            6000
          );
          stopFullScreenLoading();
        }
      },
    });
  };

  const handleDeleteAccount = async () => {
    showConfirmModal({
      type: "danger",
      title: "Eliminar Cuenta",
      message: "¿ESTÁS ABSOLUTAMENTE SEGURO?",
      details: (
        <div>
          <p className="delete-account-critical-warning">
            ⚠️ ESTA ACCIÓN ES IRREVERSIBLE ⚠️
          </p>
          <ul>
            <li>🗑️ Tu cuenta y todos tus datos serán eliminados</li>
            <li>🗑️ Todas tus tareas se perderán</li>
            <li>🗑️ Tu historial de sesiones será borrado</li>
            <li>🚫 Perderás el acceso permanentemente</li>
          </ul>
        </div>
      ),
      confirmText: "ELIMINAR CUENTA",
      onConfirm: async () => {
        closeConfirmModal();
        startFullScreenLoading(
          "Eliminando cuenta",
          "Esta acción es irreversible. Por favor, espera..."
        );

        try {
          await deleteAccount();

          await contextLogout();

          showToast("Cuenta eliminada exitosamente", "success");

          setTimeout(() => {
            stopFullScreenLoading();
            navigate("/login", { replace: true });
          }, 1500);
        } catch (error) {
          console.error("Error eliminando cuenta:", error);
          showToast(error.message || "Error eliminando cuenta", "error", 5000);
          stopFullScreenLoading();
        }
      },
    });
  };

  const handleCloseAllSessions = async () => {
    showConfirmModal({
      type: "warning",
      title: "Cerrar Sesiones",
      message: "¿Estás seguro de que quieres cerrar todas las sesiones?",
      details: (
        <ul>
          <li>Se cerrarán TODAS las sesiones activas</li>
          <li>Serás redirigido a la página de login</li>
          <li>
            Tendrás que iniciar sesión nuevamente en todos los dispositivos
          </li>
        </ul>
      ),
      confirmText: "Cerrar Todas las Sesiones",
      onConfirm: async () => {
        closeConfirmModal();
        startFullScreenLoading(
          "Cerrando todas las sesiones",
          "Estamos cerrando tu sesión en todos los dispositivos"
        );

        try {
          await closeAllSessions();
          startFullScreenLoading(
            "Sesiones cerradas",
            "Redirigiendo al login..."
          );

          setTimeout(() => {
            onLogout();
            stopFullScreenLoading();
          }, 2000);
        } catch (error) {
          showToast("Error cerrando sesiones", "error", 5000);
          stopFullScreenLoading();
        }
      },
    });
  };

  const renderTabContent = () => {
    const commonProps = {
      user,
      onUpdateProfile: handleUpdateProfile,
      onUpdatePassword: handleUpdatePassword,
      onDeleteAccount: handleDeleteAccount,
      onCloseAllSessions: handleCloseAllSessions,
    };

    switch (activeTab) {
      case "profile":
        return <UserProfileTab {...commonProps} loading={userLoading} />;
      case "password":
        return <ChangePasswordTab {...commonProps} loading={userLoading} />;
      case "sessions":
        return <SessionsTab {...commonProps} />;
      case "danger":
        return <DangerZoneTab {...commonProps} loading={userLoading} />;
      default:
        return <UserProfileTab {...commonProps} loading={userLoading} />;
    }
  };

  return (
    <>
      <div className="modal flex-display">
        <div className="modal-content user-modal-content-wrapper">
          <div className="user-modal-header">
            <h2>Configuración de Usuario</h2>
            <button className="user-modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <UserModalTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="user-modal-main-content">{renderTabContent()}</div>

          <div className="user-modal-actions">
            <button
              className="user-modal-close-button"
              onClick={onClose}
              disabled={userLoading}
            >
              Cerrar
            </button>
            <button
              className="user-modal-logout-btn"
              onClick={handleLogout}
              disabled={userLoading}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        loading={userLoading}
      />
    </>
  );
};

export default UserModal;
