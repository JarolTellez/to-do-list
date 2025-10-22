
import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContexts';

const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await onLogin(formData.username, formData.password);
    } catch (error) {
      showToast(error.message||'Intenta nuevamente', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </div>
      </form>
      <a href="#register" onClick={onSwitchToRegister}>Registrarse</a>
    </div>
  );
};

export default LoginForm;