import React, { useState, useEffect } from "react";
import { useUser } from "../../../hooks/useUser";

const UserProfileTab = ({
  user,
  showToast,
  onLogout,
  startFullScreenLoad,
  stopFullScreenLoad,
  setLoadingMessage,
  setLoadingSubMessage,
}) => {
  const { updateProfile, loading } = useUser();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = validateForm(profileData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await updateProfile({
        username: profileData.username,
        email: profileData.email,
      });

      showToast(
        response.message || "Perfil actualizado",
        "success"
      );

      startFullScreenLoad(
        "Perfil actualizado",
        "Por seguridad, cerrando sesión..."
      );

      setTimeout(() => {
        showToast(
          "Por seguridad, debes iniciar sesión nuevamente",
          "info",
          5000
        );
        onLogout();
      }, 2000);
    } catch (error) {
      showToast(error.message, "error", 6000);
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
            value={profileData.username}
            onChange={(e) =>
              setProfileData((prev) => ({ ...prev, username: e.target.value }))
            }
            className="user-form-input"
            disabled={loading}
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
            onChange={(e) =>
              setProfileData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="user-form-input"
            disabled={loading}
            placeholder="Ingresa tu correo electrónico"
          />
          {formErrors.email && (
            <span className="user-form-error">{formErrors.email}</span>
          )}
        </div>
        <button type="submit" className="user-btn-primary" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar Perfil"}
        </button>
        <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "10px" }}>
          * Después de actualizar tu perfil, deberás iniciar sesión nuevamente
          por seguridad.
        </p>
      </form>
    </div>
  );
};

const validateForm = (data) => {
  const errors = {};
  if (!data.username?.trim())
    errors.username = "El nombre de usuario es requerido";
  if (!data.email?.trim()) errors.email = "El correo electrónico es requerido";
  else if (!/\S+@\S+\.\S+/.test(data.email))
    errors.email = "El correo electrónico no es válido";
  return errors;
};
export default UserProfileTab;
