import React, { Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContexts";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";
import AppRouter from "./routers/AppRouter";
import FullScreenLoader from "./components/common/FullScreenLoader";
import "./styles/main.css";

function AppContent() {
  const { isFullScreenLoading } = useLoading();

  return (
    <div className="app">
      {isFullScreenLoading && <FullScreenLoader />}
      <AppRouter />
    </div>
  );
}

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
