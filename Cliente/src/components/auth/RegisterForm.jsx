
import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContexts';

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    if (formData.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    setLoading(true);

    try {
      const result = await onRegister(formData);
    } catch (error) {
      showToast(error.message||'Error de conexión. Intenta nuevamente.', 'error', 6000);
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
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
      <a href="#login" onClick={onSwitchToLogin}>Iniciar Sesión</a>
    </div>
  );
};

export default RegisterForm;
