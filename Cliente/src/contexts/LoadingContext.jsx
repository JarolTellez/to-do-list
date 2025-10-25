import React, { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading debe ser usado dentro de un LoadingProvider");
  }
  return context;
};

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

  const stopFullScreenLoading = useCallback(() => {
    setFullScreenLoading({
      isLoading: false,
      message: "Procesando...",
      subMessage: "Por favor, espera",
    });
  }, []);

  const startInlineLoading = useCallback((message = "") => {
    setInlineLoading({
      isLoading: true,
      message,
    });
  }, []);

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
