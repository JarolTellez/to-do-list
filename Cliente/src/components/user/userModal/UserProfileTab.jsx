import React, { useState, useEffect } from "react";

/**
 * User profile editing tab
 * @component UserProfileTab
 * @description Handles user profile information updates
 * @param {Object} props - Component properties
 * @param {Object} props.user - Current user data
 * @param {Function} props.onUpdateProfile - Profile update callback
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Profile editing form
 */
const UserProfileTab = ({ user, onUpdateProfile, loading }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
    });
  }, [user]);

  /**
   * Validates form data
   * @function validateForm
   * @param {Object} data - Form data to validate
   * @returns {Object} Validation errors object
   */
  const validateForm = (data) => {
    const errors = {};
    if (!data.username?.trim())
      errors.username = "El nombre de usuario es requerido";
    if (!data.email?.trim())
      errors.email = "El correo electrónico es requerido";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      errors.email = "El correo electrónico no es válido";
    return errors;
  };

  /**
   * Handles form submission
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    onUpdateProfile(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className="user-tab-content">
      <form onSubmit={handleSubmit}>
        <div
          className={`user-form-group ${formErrors.username ? "error" : ""}`}
        >
          <label>Nombre de usuario</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className="user-form-input"
            placeholder="Ingresa tu nombre de usuario"
            disabled={loading}
          />
          {formErrors.username && (
            <span className="user-form-error">{formErrors.username}</span>
          )}
        </div>
        <div className={`user-form-group ${formErrors.email ? "error" : ""}`}>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="user-form-input"
            placeholder="Ingresa tu correo electrónico"
            disabled={loading}
          />
          {formErrors.email && (
            <span className="user-form-error">{formErrors.email}</span>
          )}
        </div>
        <button type="submit" className="user-btn-primary" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar Perfil"}
        </button>
        <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "10px" }}>
          * Después de actualizar tu perfil, la sesión se cerrará
          automáticamente por seguridad.
        </p>
      </form>
    </div>
  );
};

export default UserProfileTab;
