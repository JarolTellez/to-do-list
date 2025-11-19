import React from "react";
import RegisterForm from "../../components/auth/RegisterForm";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContexts";
import { useLoading } from "../../contexts/LoadingContext";
import { useNavigate } from "react-router-dom";

/**
 * User registration page component
 * @component RegisterPage
 * @description Handles new user registration process
 * @returns {JSX.Element} Registration page interface
 */
const RegisterPage = () => {
  const { register } = useAuthContext();
  const { showToast } = useToast();
  const { startFullScreenLoading, stopFullScreenLoading } = useLoading();
  const navigate = useNavigate();

  /**
   * Handles user registration process
   * @async
   * @function handleRegister
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  const handleRegister = async (userData) => {
    startFullScreenLoading("Registrando usuario", "Creando tu cuenta...");

    try {
      const response = await register(userData);
      showToast("Usuario registrado exitosamente", "success");
      navigate("/login");
      return response;
    } catch (error) {
      const errorMessage = error.message || "Error en el registro";
      showToast(errorMessage, "error", 6000);
      throw error;
    } finally {
      stopFullScreenLoading();
    }
  };

  /**
   * Navigates to login page
   * @function handleSwitchToLogin
   */
  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </div>
    </div>
  );
};

export default RegisterPage;
