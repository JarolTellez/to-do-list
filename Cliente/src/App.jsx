import React, { Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContexts';
import { LoadingProvider } from './contexts/LoadingContext';
import AppRouter from './routers/AppRouter';
import FullScreenLoader from './components/common/FullScreenLoader';
import './styles/main.css';

function App() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<FullScreenLoader message="Cargando aplicación..." />}>
            <div className="app">
              <FullScreenLoader />
              <AppRouter />
            </div>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}

export default App;