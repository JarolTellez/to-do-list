import React, { useState, useEffect } from "react";

const UserProfileTab = ({ user, onUpdateProfile }) => {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setProfileData({
      username: user?.username || "",
      email: user?.email || "",
    });
  }, [user]);

  const validateForm = (data) => {
    const errors = {};
    if (!data.username?.trim()) errors.username = "El nombre de usuario es requerido";
    if (!data.email?.trim()) errors.email = "El correo electrónico es requerido";
    else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = "El correo electrónico no es válido";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = validateForm(profileData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    onUpdateProfile(profileData);
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
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
        <div className={`user-form-group ${formErrors.username ? "error" : ""}`}>
          <label>Nombre de usuario</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className="user-form-input"
            placeholder="Ingresa tu nombre de usuario"
          />
          {formErrors.username && (
            <span className="user-form-error">{formErrors.username}</span>
          )}
        </div>
        <div className={`user-form-group ${formErrors.email ? "error" : ""}`}>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="user-form-input"
            placeholder="Ingresa tu correo electrónico"
          />
          {formErrors.email && (
            <span className="user-form-error">{formErrors.email}</span>
          )}
        </div>
        <button
          type="submit"
          className="user-btn-primary"
        >
          Actualizar Perfil
        </button>
        <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "10px" }}>
          * Después de actualizar tu perfil, la sesión se cerrará automáticamente por seguridad.
        </p>
      </form>
    </div>
  );
};

export default UserProfileTab;