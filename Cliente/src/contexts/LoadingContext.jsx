import React, { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading debe ser usado dentro de un LoadingProvider");
  }
  return context;
};

/**
 * Loading state management context
 * @context LoadingProvider
 * @description Manages global loading states for full-screen and inline loaders
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Loading context provider
 */
export const LoadingProvider = ({ children }) => {
  const [fullScreenLoading, setFullScreenLoading] = useState({
    isLoading: false,
    message: "Procesando...",
    subMessage: "Por favor, espera",
  });

  const [inlineLoading, setInlineLoading] = useState({
    isLoading: false,
    message: "",
  });

  /**
   * Starts full-screen loading with custom messages
   * @function startFullScreenLoading
   * @param {string} message - Primary loading message
   * @param {string} subMessage - Secondary loading message
   */
  const startFullScreenLoading = useCallback(
    (message = "Procesando...", subMessage = "Por favor, espera") => {
      setFullScreenLoading({
        isLoading: true,
        message,
        subMessage,
      });
    },
    []
  );

  /**
   * Stops full-screen loading
   * @function stopFullScreenLoading
   */
  const stopFullScreenLoading = useCallback(() => {
    setFullScreenLoading({
      isLoading: false,
      message: "Procesando...",
      subMessage: "Por favor, espera",
    });
  }, []);

  /**
   * Starts inline loading with message
   * @function startInlineLoading
   * @param {string} message - Loading message
   */
  const startInlineLoading = useCallback((message = "") => {
    setInlineLoading({
      isLoading: true,
      message,
    });
  }, []);

  /**
   * Stops inline loading
   * @function stopInlineLoading
   */
  const stopInlineLoading = useCallback(() => {
    setInlineLoading({
      isLoading: false,
      message: "",
    });
  }, []);

  const value = {
    isFullScreenLoading: fullScreenLoading.isLoading,
    fullScreenMessage: fullScreenLoading.message,
    fullScreenSubMessage: fullScreenLoading.subMessage,
    startFullScreenLoading,
    stopFullScreenLoading,

    isInlineLoading: inlineLoading.isLoading,
    inlineMessage: inlineLoading.message,
    startInlineLoading,
    stopInlineLoading,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};
