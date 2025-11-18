import React, { useState } from "react";
import { useToast } from "../../contexts/ToastContexts";

/**
 * User registration form component
 * @component RegisterForm
 * @description Handles new user registration with validation
 * @param {Object} props - Component properties
 * @param {Function} props.onRegister - Callback function for registration submission
 * @param {Function} props.onSwitchToLogin - Callback to switch to login view
 * @returns {JSX.Element} Registration form interface
 */
const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  /**
   * Handles form submission for user registration
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      showToast("Por favor completa todos los campos", "warning");
      return;
    }

    if (formData.password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "warning");
      return;
    }

    setLoading(true);

    try {
      await onRegister(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container">
      <h1>Registrar</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Usuario"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>
      <a href="#login" onClick={onSwitchToLogin}>
        Iniciar Sesión
      </a>
    </div>
  );
};

export default RegisterForm;
