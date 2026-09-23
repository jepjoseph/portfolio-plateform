import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

import "./RouteGuards.css";

/*
 * =========================================
 * Guest Route
 * =========================================
 *
 * Authentication pages use this guard so an
 * already authenticated user is directed to
 * the main application dashboard.
 */

function GuestRoute({ children = null }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <main className="route-guard-status" aria-live="polite" aria-busy="true">
        <div className="route-guard-spinner" aria-hidden="true" />

        <p>Checking your session...</p>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}

export default GuestRoute;
