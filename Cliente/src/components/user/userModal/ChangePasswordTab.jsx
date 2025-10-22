import React, { useState } from 'react';
import { useUser } from '../../../hooks/useUser';

const ChangePasswordTab = ({ showToast, startFullScreenLoad, stopFullScreenLoad, setLoadingMessage, setLoadingSubMessage }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const {updatePassword}= useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setLoading(true);
    
    const errors = {};
    if (!passwordData.currentPassword.trim()) errors.currentPassword = 'La contraseña actual es requerida';
    if (!passwordData.newPassword.trim()) errors.newPassword = 'La nueva contraseña es requerida';
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

  
        showToast(response.message||'Contraseña actualizada', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
  
    } catch (error) {
      showToast(error.message||'Error cambiando contraseña', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setFormErrors({});
  };

  return (
    <div className="user-tab-content">
      <form onSubmit={handleSubmit}>
        <div className={`user-form-group ${formErrors.currentPassword ? 'error' : ''}`}>
          <label>Contraseña actual</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
            className="user-form-input"
            disabled={loading}
            placeholder="Ingresa tu contraseña actual"
          />
          {formErrors.currentPassword && <span className="user-form-error">{formErrors.currentPassword}</span>}
        </div>
        <div className={`user-form-group ${formErrors.newPassword ? 'error' : ''}`}>
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
            className="user-form-input"
            disabled={loading}
            placeholder="Ingresa tu nueva contraseña"
          />
          {formErrors.newPassword && <span className="user-form-error">{formErrors.newPassword}</span>}
        </div>
        <div className={`user-form-group ${formErrors.confirmPassword ? 'error' : ''}`}>
          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
            className="user-form-input"
            disabled={loading}
            placeholder="Confirma tu nueva contraseña"
          />
          {formErrors.confirmPassword && <span className="user-form-error">{formErrors.confirmPassword}</span>}
        </div>
        <div className="user-form-buttons">
          <button type="submit" className="user-btn-primary" disabled={loading}>
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
          <button type="button" className="user-btn-secondary" onClick={resetForm} disabled={loading}>
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordTab;