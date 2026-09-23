import { Navigate, Outlet } from "react-router-dom";

import { AUTH_STATUS, useAuth } from "../context/AuthContext.jsx";

import "./RouteGuards.css";

/*
 * =========================================
 * Protected Route
 * =========================================
 *
 * This component does not provide backend
 * security. Every protected API endpoint must
 * still validate the server-side session.
 */

function ProtectedRoute({ children = null }) {
  const {
    status,
    error,
    isAuthenticated,
    isInitializing,
    restoreAuthentication,
  } = useAuth();

  /*
   * Wait for initial cookie-based session
   * restoration before redirecting.
   */

  if (isInitializing) {
    return (
      <main className="route-guard-status" aria-live="polite" aria-busy="true">
        <div className="route-guard-spinner" aria-hidden="true" />

        <p>Checking your session...</p>
      </main>
    );
  }

  /*
   * A backend or network failure is different
   * from an ordinary signed-out state.
   */

  if (status === AUTH_STATUS.ERROR) {
    return (
      <main className="route-guard-status" role="alert">
        <div className="route-guard-panel">
          <span className="route-guard-eyebrow">Connection problem</span>

          <h1>We could not verify your session</h1>

          <p>
            {error?.message ||
              "The authentication service is temporarily unavailable."}
          </p>

          <button
            type="button"
            onClick={() => {
              void restoreAuthentication();
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /*
   * Do not preserve the previous protected
   * location. A future successful login will
   * always begin at /dashboard.
   */

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
