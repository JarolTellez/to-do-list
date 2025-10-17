import { useState, useEffect } from 'react';
import { 
  getUserSessions, 
  closeAllSessions, 
  closeSession 
} from '../services/sessions.js';

export const useSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserSessions();
      
      if (result.success) {
        setSessions(result.sessions);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Error cargando sesiones';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAllSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await closeAllSessions();
      
      if (result.success) {
        await loadSessions();
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Error cerrando sesiones';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await closeSession(sessionId);
      
      if (result.success) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Error cerrando sesión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadSessions();
  }, []);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    closeAllSessions: handleCloseAllSessions,
    closeSession: handleCloseSession
  };
};