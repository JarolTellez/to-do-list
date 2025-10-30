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

  const loadSessions = useCallback(async (page, limit, isLoadMore = false) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: page === SESSIONS_PAGINATION.INITIAL_PAGE && !isLoadMore,
        loadingMore: isLoadMore,
        error: null,
      }));

      const response = await getUserSessions(
        page || SESSIONS_PAGINATION.INITIAL_PAGE,
        limit || SESSIONS_PAGINATION.DEFAULT_LIMIT
      );

      const sessionsFromResponse = response.data || [];
      const totalCount = response.totalCount || 0;

      setState((prev) => {
        const newSessions =
          page === SESSIONS_PAGINATION.INITIAL_PAGE && !isLoadMore
            ? sessionsFromResponse
            : [...prev.sessions, ...sessionsFromResponse];

        return {
          sessions: newSessions,
          hasMore:
            sessionsFromResponse.length ===
            (limit || SESSIONS_PAGINATION.DEFAULT_LIMIT),
          currentPage: page,
          totalSessions:
            page === SESSIONS_PAGINATION.INITIAL_PAGE
              ? totalCount
              : prev.totalSessions,
          loading: false,
          loadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Error cargando sesiones",
        loading: false,
        loadingMore: false,
      }));
    }
  }, []);

  const loadMoreSessions = useCallback(async () => {
    if (state.loadingMore || !state.hasMore || state.loading) {
      return;
    }

    await loadSessions(
      state.currentPage + 1,
      SESSIONS_PAGINATION.LOAD_MORE_LIMIT,
      true
    );
  }, [
    state.loadingMore,
    state.hasMore,
    state.currentPage,
    state.loading,
    loadSessions,
  ]);

  const refreshSessions = useCallback(async () => {
    await loadSessions(
      SESSIONS_PAGINATION.INITIAL_PAGE,
      SESSIONS_PAGINATION.DEFAULT_LIMIT
    );
  }, [loadSessions]);

  useEffect(() => {
    loadSessions(
      SESSIONS_PAGINATION.INITIAL_PAGE,
      SESSIONS_PAGINATION.DEFAULT_LIMIT
    );
  }, [loadSessions]);

  const handleCloseAllSessions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await closeAllSessions();
      await loadSessions(
        SESSIONS_PAGINATION.INITIAL_PAGE,
        SESSIONS_PAGINATION.DEFAULT_LIMIT
      );
    } catch (error) {
      const errorMessage = error.message || "Error cerrando sesiones";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      throw error;
    }
  }, [loadSessions]);

  const handleCloseSession = useCallback(
    async (sessionId) => {
      const previousSessions = state.sessions;

      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((session) => session.id !== sessionId),
        totalSessions: Math.max(0, prev.totalSessions - 1),
        error: null,
      }));

      try {
        await closeSession(sessionId);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          sessions: previousSessions,
          totalSessions: previousSessions.length,
          error: error.message || "Error cerrando sesión",
        }));
        throw error;
      }
    },
    [state.sessions]
  );

  return {
    ...state,
    loadSessions,
    loadMoreSessions,
    refreshSessions,
    closeAllSessions: handleCloseAllSessions,
    closeSession: handleCloseSession,
  };
};
