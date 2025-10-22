import { useState, useEffect, useCallback } from "react";
import {
  getUserSessions,
  closeAllSessions,
  closeSession,
} from "../services/sessions.js";

export const useSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUserSessions();
      setSessions(response.data || []);
      return response;
    } catch (error) {
      setError(error.message || "Error cargando sesiones");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCloseAllSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await closeAllSessions();
      return response;
    } catch (error) {
      setError(error.message || "Error cerrando sesiones");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await closeSession(sessionId);

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      return response;
    } catch (error) {
      setError(error.message || "Error cerrando sesión");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    closeAllSessions: handleCloseAllSessions,
    closeSession: handleCloseSession,
  };
};
