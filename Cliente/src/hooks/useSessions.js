// import { useState, useEffect, useCallback } from "react";
// import {
//   getUserSessions,
//   closeAllSessions,
//   closeSession,
// } from "../services/sessions.js";
// import { PAGINATION_CONFIG } from "../utils/constants/paginationConstants";
// const SESSIONS_PAGINATION = PAGINATION_CONFIG.SESSIONS;

// export const useSessions = () => {
//   const [sessions, setSessions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const loadSessions = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await getUserSessions(SESSIONS_PAGINATION.INITIAL_PAGE, SESSIONS_PAGINATION.DEFAULT_LIMIT);
//       setSessions(response.data || []);
//       return response;
//     } catch (error) {
//       setError(error.message || "Error cargando sesiones");
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadSessions();
//   }, []);

//   const handleCloseAllSessions = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await closeAllSessions();
//       return response;
//     } catch (error) {
//       setError(error.message || "Error cerrando sesiones");
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const handleCloseSession = useCallback(async (sessionId) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await closeSession(sessionId);

//       setSessions((prev) => prev.filter((session) => session.id !== sessionId));
//       return response;
//     } catch (error) {
//       setError(error.message || "Error cerrando sesión");
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return {
//     sessions,
//     loading,
//     error,
//     loadSessions,
//     closeAllSessions: handleCloseAllSessions,
//     closeSession: handleCloseSession,
//   };
// };


// ARCHIVO: C:\Users\Jarol\Documents\Habilidades Jarol ;)\JavaScript_Practica\Ejercicios_practicos\To-do-list\Cliente\src\hooks\useSessions.js
import { useState, useEffect, useCallback } from "react";
import {
  getUserSessions,
  closeAllSessions,
  closeSession,
} from "../services/sessions.js";
import { PAGINATION_CONFIG } from "../utils/constants/paginationConstants";
const SESSIONS_PAGINATION = PAGINATION_CONFIG.SESSIONS;

export const useSessions = () => {
  const [state, setState] = useState({
    sessions: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    currentPage: SESSIONS_PAGINATION.INITIAL_PAGE,
    totalSessions: 0,
  });

  const loadSessions = useCallback(async (page, limit) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: page === SESSIONS_PAGINATION.INITIAL_PAGE,
        loadingMore: page > SESSIONS_PAGINATION.INITIAL_PAGE,
        error: null,
      }));

      const response = await getUserSessions(
        page || SESSIONS_PAGINATION.INITIAL_PAGE,
        limit || SESSIONS_PAGINATION.DEFAULT_LIMIT
      );
      
      const sessionsFromResponse = response.data || [];

      setState((prev) => {
        const newSessions = 
          page === SESSIONS_PAGINATION.INITIAL_PAGE
            ? sessionsFromResponse
            : [...prev.sessions, ...sessionsFromResponse];

        return {
          sessions: newSessions,
          hasMore: sessionsFromResponse.length >= (limit || SESSIONS_PAGINATION.DEFAULT_LIMIT),
          currentPage: page,
          totalSessions: prev.totalSessions + sessionsFromResponse.length,
          loading: false,
          loadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      console.error("Error loading sessions:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Error cargando sesiones",
        loading: false,
        loadingMore: false,
      }));
    }
  }, []);

  const loadMoreSessions = useCallback(async () => {
    if (state.loadingMore || !state.hasMore) {
      return;
    }
    try {
      setState((prev) => ({ ...prev, loadingMore: true }));
      await loadSessions(state.currentPage + 1, SESSIONS_PAGINATION.LOAD_MORE_LIMIT);
    } catch (error) {
      console.error("Error loading more sessions:", error);
      setState((prev) => ({
        ...prev,
        loadingMore: false,
      }));
    }
  }, [state.loadingMore, state.hasMore, state.currentPage, loadSessions]);

  const refreshSessions = useCallback(async () => {
    try {
      await loadSessions(SESSIONS_PAGINATION.INITIAL_PAGE, SESSIONS_PAGINATION.DEFAULT_LIMIT);
    } catch (error) {
      console.error("Error refreshing sessions:", error);
      throw error;
    }
  }, [loadSessions]);

  useEffect(() => {
    loadSessions(SESSIONS_PAGINATION.INITIAL_PAGE, SESSIONS_PAGINATION.DEFAULT_LIMIT);
  }, [loadSessions]);

  const handleCloseAllSessions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await closeAllSessions();
      // Recargar sesiones después de cerrar todas
      await loadSessions(SESSIONS_PAGINATION.INITIAL_PAGE, SESSIONS_PAGINATION.DEFAULT_LIMIT);
      return response;
    } catch (error) {
      setState((prev) => ({ 
        ...prev, 
        error: error.message || "Error cerrando sesiones",
        loading: false 
      }));
      throw error;
    }
  }, [loadSessions]);

  const handleCloseSession = useCallback(async (sessionId) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await closeSession(sessionId);
      // Actualizar lista localmente
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((session) => session.id !== sessionId),
        totalSessions: prev.totalSessions - 1,
        loading: false,
      }));
      return response;
    } catch (error) {
      setState((prev) => ({ 
        ...prev, 
        error: error.message || "Error cerrando sesión",
        loading: false 
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    loadSessions,
    loadMoreSessions,
    refreshSessions,
    closeAllSessions: handleCloseAllSessions,
    closeSession: handleCloseSession,
  };
};