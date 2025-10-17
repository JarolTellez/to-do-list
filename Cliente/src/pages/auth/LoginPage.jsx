import React from 'react';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <LoginForm 
          onLogin={onLogin} 
          onSwitchToRegister={onSwitchToRegister} 
        />
      </div>
    </div>
  );
};

export default LoginPage;