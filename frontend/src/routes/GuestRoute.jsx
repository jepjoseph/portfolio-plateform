import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

import "./RouteGuards.css";

/*
 * =========================================
 * Safe Internal Destination
 * =========================================
 */

function getSafeReturnTo(value) {
  if (typeof value !== "string") {
    return "";
  }

  const destination = value.trim();

  /*
   * Only permit internal application paths.
   * This prevents open redirects to external
   * websites after authentication.
   */

  if (
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    destination.includes("://")
  ) {
    return "";
  }

  /*
   * Do not redirect an authenticated user
   * back to another authentication page.
   */

  if (destination.startsWith("/auth")) {
    return "";
  }

  return destination;
}

/*
 * =========================================
 * Guest Route
 * =========================================
 *
 * Authentication pages use this guard so an
 * already signed-in user is redirected to the
 * application instead of seeing login again.
 */

function GuestRoute({ children = null }) {
  const location = useLocation();

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
    const returnTo = getSafeReturnTo(location.state?.returnTo);

    return <Navigate to={returnTo || "/dashboard"} replace />;
  }

  return children || <Outlet />;
}

export default GuestRoute;
