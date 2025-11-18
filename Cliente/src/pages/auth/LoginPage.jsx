import React from "react";
import LoginForm from "../../components/auth/LoginForm";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContexts";
import { useLoading } from "../../contexts/LoadingContext";
import { useNavigate } from "react-router-dom";

/**
 * User login page component
 * @component LoginPage
 * @description Handles user authentication and login process
 * @returns {JSX.Element} Login page interface
 */
const LoginPage = () => {
  const { login } = useAuthContext();
  const { showToast } = useToast();
  const { startFullScreenLoading, stopFullScreenLoading } = useLoading();
  const navigate = useNavigate();

  /**
   * Handles user login process
   * @async
   * @function handleLogin
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  const handleLogin = async (username, password) => {
    startFullScreenLoading("Iniciando sesión", "Verificando credenciales...");

    try {
      const response = await login(username, password);
      showToast("Inicio de sesión exitoso", "success");
      return response;
    } catch (error) {
      const errorMessage = error.message || "Error al iniciar sesión";
      showToast(errorMessage, "error", 6000);
      throw error;
    } finally {
      stopFullScreenLoading();
    }
  };

  /**
   * Navigates to registration page
   * @function handleSwitchToRegister
   */
  const handleSwitchToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
        />
      </div>
    </div>
  );
};

export default LoginPage;
