import React from 'react';
import { useSessions } from '../../../hooks/useSessions';

const SessionsTab = ({ showToast, startFullScreenLoad, stopFullScreenLoad, onLogout, showConfirmModal, setLoadingMessage, setLoadingSubMessage }) => {
 const { 
    sessions, 
    loading, 
    error,
    loadSessions,
    closeAllSessions 
  } = useSessions();
  
   React.useEffect(() => {
    if (error) {
      showToast(error, 'error', 5000);
    }
  }, [error, showToast]);


  const handleCloseAllSessions = () => {
    showConfirmModal({
      type: 'warning',
      title: 'Cerrar Sesiones',
      message: '¿Estás seguro de que quieres cerrar todas las sesiones?',
      details: (
        <ul>
          <li>Se cerrarán TODAS las sesiones activas</li>
          <li>Serás redirigido a la página de login</li>
          <li>Tendrás que iniciar sesión nuevamente en todos los dispositivos</li>
        </ul>
      ),
      confirmText: 'Cerrar Todas las Sesiones',
      onConfirm: async () => {
        startFullScreenLoad("Cerrando todas las sesiones", "Estamos cerrando tu sesión en todos los dispositivos");
        
        try {
          const result = await closeAllSessions();
          if (result.success) {
            setLoadingMessage("Sesiones cerradas correctamente");
            setLoadingSubMessage("Redirigiendo al login");
            
            setTimeout(() => {
              onLogout();
            }, 2000);
          } else {
            setLoadingMessage("Error al cerrar sesiones");
            setLoadingSubMessage(result.error);
            
            setTimeout(() => {
              stopFullScreenLoad();
              showToast(result.error, 'error', 6000);
            }, 3000);
          }
        } catch (error) {
          setLoadingMessage("Error inesperado");
          setLoadingSubMessage("Por favor, intenta nuevamente");
          
          setTimeout(() => {
            stopFullScreenLoad();
            showToast('Error cerrando sesiones', 'error', 5000);
          }, 3000);
        }
      }
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUserAgent = (userAgent) => {
    if (!userAgent) return 'Desconocido';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('postman')) return 'Postman';
    if (ua.includes('insomnia')) return 'Insomnia';
    if (ua.includes('thunder client')) return 'Thunder Client';
    
    let browser = 'Navegador';
    if (ua.includes('edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Google Chrome';
    else if (ua.includes('firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('opera')) browser = 'Opera';
    
    let os = 'Sistema desconocido';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    let device = 'PC';
    if (ua.includes('mobile')) device = 'Móvil';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
    else if (ua.includes('android') && !ua.includes('mobile')) device = 'Tablet Android';
    else if (ua.includes('iphone')) device = 'iPhone';
    
    return `${browser} • ${os} • ${device}`;
  };

  return (
    <div className="user-tab-content">
      <div className="user-sessions-header">
        <h3>Sesiones Activas</h3>
        <button 
          className="user-btn-danger user-btn-sm"
          onClick={handleCloseAllSessions}
          disabled={loading || sessions.length <= 1}
        >
          {loading ? 'Cerrando...' : 'Cerrar Todas las Sesiones'}
        </button>
      </div>
      
      {loading ? (
        <div className="user-loading">Cargando sesiones...</div>
      ) : (
        <div className="user-sessions-list">
          {sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d' }}>
              No hay sesiones activas
            </p>
          ) : (
            sessions.map(session => (
              <div key={session.id} className={`user-session-item ${session.isCurrent ? 'current' : ''}`}>
                <div className="user-session-info">
                  <div className="user-session-platform">
                    {formatUserAgent(session.userAgent)}
                    {session.isCurrent && <span className="user-current-badge">Actual</span>}
                  </div>
                  <div className="user-session-details">
                    <div><strong>IP:</strong> {session.ip === "::1" ? "Localhost" : session.ip}</div>
                    <div><strong>Creada:</strong> {formatDate(session.createdAt)}</div>
                    <div><strong>Expira:</strong> {formatDate(session.expiresAt)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SessionsTab;