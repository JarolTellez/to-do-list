
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useToast } from './components/contexts/ToastContexts';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Principal from './pages/tasks/Principal';
import './styles/login.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components/tasks.css';
import './styles/components/modals.css';
import './styles/components/user-modal.css';
import './styles/components/forms.css';
import './styles/components/toast.css';
import './styles/utilities.css';
import './styles/responsive.css';
import './styles/components/confirm-modal.css';

function App() {
  const { user, isAuthenticated, login, logout, register, loading } = useAuth();
  const [currentView, setCurrentView] = useState('login');
  const { showToast } = useToast();

  useEffect(() => {

    
    if (!loading) {
      if (isAuthenticated && user) {
        setCurrentView('todo');
      } else {
        setCurrentView('login');
      }
    }
  }, [isAuthenticated, loading, user]);

  const handleLogin = async (username, password) => {
    const response = await login(username, password);
    
    
    if (response && response.success === false) {
      showToast(response.error, 'error', 6000);
      return response;
    }
    
    if (response && response.success) {
      showToast('Inicio de sesión exitoso', 'success');
    }
    
    return response;
  };

  const handleRegister = async (userData) => {
    const response = await register(userData);
    
    
    if (response) {
      showToast('Usuario registrado', 'success');
      setCurrentView('login');
    } else {
       const errorMessage = response?.error || 'Error desconocido';
      showToast(errorMessage, 'error', 6000);
    }
    
    return response;
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('login');
    showToast('Sesión cerrada', 'success');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setCurrentView('register')} 
          />
        );
      case 'register':
        return (
          <RegisterPage 
            onRegister={handleRegister} 
            onSwitchToLogin={() => setCurrentView('login')} 
          />
        );
      case 'todo':
        return <Principal user={user} onLogout={handleLogout} />;
      default:
        return (
          <LoginPage 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setCurrentView('register')} 
          />
        );
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;