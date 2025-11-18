import React, { useState } from "react";

/**
 * Password change tab component
 * @component ChangePasswordTab
 * @description Handles password change functionality with validation
 * @param {Object} props - Component properties
 * @param {Function} props.onUpdatePassword - Password update callback
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Password change form
 */
const ChangePasswordTab = ({ onUpdatePassword, loading }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});

  /**
   * Handles password form submission
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!passwordData.currentPassword.trim())
      errors.currentPassword = "La contraseña actual es requerida";
    if (!passwordData.newPassword.trim())
      errors.newPassword = "La nueva contraseña es requerida";
    else if (passwordData.newPassword.length < 6)
      errors.newPassword = "La contraseña debe tener al menos 6 caracteres";
    if (passwordData.newPassword !== passwordData.confirmPassword)
      errors.confirmPassword = "Las contraseñas no coinciden";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onUpdatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  /**
   * Resets form to initial state
   * @function resetForm
   */
  const resetForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="user-tab-content">
      <form onSubmit={handleSubmit}>
        <div
          className={`user-form-group ${
            formErrors.currentPassword ? "error" : ""
          }`}
        >
          <label>Contraseña actual</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              handleInputChange("currentPassword", e.target.value)
            }
            className="user-form-input"
            placeholder="Ingresa tu contraseña actual"
            disabled={loading}
          />
          {formErrors.currentPassword && (
            <span className="user-form-error">
              {formErrors.currentPassword}
            </span>
          )}
        </div>
        <div
          className={`user-form-group ${formErrors.newPassword ? "error" : ""}`}
        >
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => handleInputChange("newPassword", e.target.value)}
            className="user-form-input"
            placeholder="Ingresa tu nueva contraseña"
            disabled={loading}
          />
          {formErrors.newPassword && (
            <span className="user-form-error">{formErrors.newPassword}</span>
          )}
        </div>
        <div
          className={`user-form-group ${
            formErrors.confirmPassword ? "error" : ""
          }`}
        >
          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            className="user-form-input"
            placeholder="Confirma tu nueva contraseña"
            disabled={loading}
          />
          {formErrors.confirmPassword && (
            <span className="user-form-error">
              {formErrors.confirmPassword}
            </span>
          )}
        </div>
        <div className="user-form-buttons">
          <button type="submit" className="user-btn-primary" disabled={loading}>
            {loading ? "Cambiando Contraseña..." : "Cambiar Contraseña"}
          </button>
          <button
            type="button"
            className="user-btn-secondary"
            onClick={resetForm}
            disabled={loading}
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordTab;
