import { useState, useEffect } from 'react';
import { loadTags } from '../services/tags';

export const useTags = () => {
  const [state, setState] = useState({
    tags: [],
    loading: false,
    error: null
  });

  const loadAvailableTags = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await loadTags();
      setState({
        tags: response.data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      if (error.status !== 401) {
        setState({
          tags: [],
          loading: false,
          error: error
        });
      } else {
        setState({
          tags: [],
          loading: false,
          error: null 
        });
      }
    }
  };

  useEffect(() => {
    loadAvailableTags();
  }, []);

  return {
    ...state,
    refreshTags: loadAvailableTags
  };
};