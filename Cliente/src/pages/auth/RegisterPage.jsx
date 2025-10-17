import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';

const RegisterPage = ({ onRegister, onSwitchToLogin }) => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <RegisterForm 
          onRegister={onRegister} 
          onSwitchToLogin={onSwitchToLogin} 
        />
      </div>
    </div>
  );
};

export default RegisterPage;