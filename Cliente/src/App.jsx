import React, { Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContexts";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";
import AppRouter from "./routers/AppRouter";
import FullScreenLoader from "./components/common/FullScreenLoader";
import "./styles/main.css";

/**
 * Application content component that handles full-screen loading states
 * @component AppContent
 * @description Renders the main app content with loading state management
 * @returns {JSX.Element} The application content with conditional loader
 */
function AppContent() {
  const { isFullScreenLoading } = useLoading();

  return (
    <div className="app">
      {isFullScreenLoading && <FullScreenLoader />}
      <AppRouter />
    </div>
  );
}

/**
 * Main application component that provides global context providers
 * @component App
 * @description Root component that wraps the entire application with necessary context providers
 * @returns {JSX.Element} The main application structure
 */
function App() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <AuthProvider>
          <Suspense
            fallback={<FullScreenLoader message="Cargando aplicación..." />}
          >
            <AppContent />
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}

export default App;
