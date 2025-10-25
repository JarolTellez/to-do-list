import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import FullScreenLoader from "../components/common/FullScreenLoader";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import Principal from "../pages/tasks/Principal";

const AppRouter = () => {
  const { user, isAuthenticated, loading, logout } = useAuthContext();

  if (loading) {
    return <FullScreenLoader message="Verificando sesión..." />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routess */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />
          }
        />

        {/* Main protected route*/}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Principal user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
