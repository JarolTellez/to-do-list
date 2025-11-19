import React, { useState } from "react";
import { useToast } from "../../contexts/ToastContexts";
/**
 * Authentication login form component
 * @component LoginForm
 * @description Handles user login with username and password
 * @param {Object} props - Component properties
 * @param {Function} props.onLogin - Callback function for login submission
 * @param {Function} props.onSwitchToRegister - Callback to switch to registration view
 * @returns {JSX.Element} Login form interface
 */
const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  /**
   * Handles form submission for user login
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      showToast("Por favor completa todos los campos", "warning");
      return;
    }

    setLoading(true);

    try {
      if (typeof onLogin !== "function") {
        throw new Error("Función de login no disponible");
      }

      await onLogin(formData.username, formData.password);
    } catch (error) {
      console.error("Error en login:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles input field changes
   * @function handleChange
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container">
      <h1>Inicia sesión</h1>
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
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <div className="button-container">
          <button type="submit" disabled={loading}>
            {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </button>
        </div>
      </form>
      <a href="#register" onClick={onSwitchToRegister}>
        Registrarse
      </a>
    </div>
  );
};

export default LoginForm;
