import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContexts';
import { useLoading } from '../../contexts/LoadingContext';
import { useNavigate } from 'react-router-dom'; 

const LoginPage = () => {
  const { login } = useAuthContext();
  const { showToast } = useToast();
  const { startFullScreenLoading, stopFullScreenLoading } = useLoading();
  const navigate = useNavigate();

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

  const handleSwitchToRegister = () => {
    navigate('/register'); 
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