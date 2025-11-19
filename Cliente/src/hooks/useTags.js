import { useState, useEffect } from "react";
import { loadTags } from "../services/tags";

/**
 * Tags management hook
 * @hook useTags
 * @description Manages available tags for tasks
 * @returns {Object} Tags state and methods
 */
export const useTags = () => {
  const [state, setState] = useState({
    tags: [],
    loading: false,
    error: null,
  });

  /**
   * Loads available tags from API
   * @async
   * @function loadAvailableTags
   * @returns {Promise<void>}
   */
  const loadAvailableTags = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await loadTags();
      setState({
        tags: response.data || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      if (error.status !== 401) {
        setState({
          tags: [],
          loading: false,
          error: error,
        });
      } else {
        setState({
          tags: [],
          loading: false,
          error: null,
        });
      }
    }
  };

  useEffect(() => {
    loadAvailableTags();
  }, []);

  return {
    ...state,
    refreshTags: loadAvailableTags,
  };
};
