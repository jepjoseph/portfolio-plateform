import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

import {
  ROUTE_TRANSITION_DURATION_MS,
  runRouteTransition,
} from "../../utils/routeTransition.js";

import PublicNavigation from "../PublicNavigation/PublicNavigation.jsx";

import "./PublicHeader.css";

/*
 * =========================================
 * Modified Navigation
 * =========================================
 */

function isModifiedNavigation(event) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/*
 * =========================================
 * Public Header
 * =========================================
 */

function PublicHeader() {
  const navigate = useNavigate();

  const location = useLocation();

  const { isAuthenticated } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /*
   * Close the mobile menu whenever the route
   * changes.
   */

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /*
   * Close the mobile menu with Escape.
   */

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  /*
   * =========================================
   * Authentication Navigation
   * =========================================
   */

  function handleAuthenticationNavigation(event, destination) {
    if (isModifiedNavigation(event)) {
      return;
    }

    event.preventDefault();

    setIsMobileMenuOpen(false);

    runRouteTransition(
      () => {
        navigate(destination);
      },
      {
        name: "page-to-auth",

        duration: ROUTE_TRANSITION_DURATION_MS,
      },
    );
  }

  function handlePublicNavigation() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link
          to="/"
          className="public-header-brand"
          aria-label="Portfolio Platform homepage"
        >
          <span className="public-header-brand-mark" aria-hidden="true">
            PP
          </span>

          <span className="public-header-brand-text">
            <strong>Portfolio Platform</strong>

            <small>Build. Present. Grow.</small>
          </span>
        </Link>

        <div className="public-header-desktop-navigation">
          <PublicNavigation
            variant="public"
            onNavigate={handlePublicNavigation}
          />
        </div>

        <div className="public-header-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="public-header-primary-action">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="public-header-secondary-action"
                onClick={(event) => {
                  handleAuthenticationNavigation(event, "/auth/login");
                }}
              >
                Sign In
              </Link>

              <Link
                to="/auth/register"
                className="public-header-primary-action"
                onClick={(event) => {
                  handleAuthenticationNavigation(event, "/auth/register");
                }}
              >
                Create Account
              </Link>
            </>
          )}

          <button
            type="button"
            className="public-header-menu-button"
            aria-label={
              isMobileMenuOpen
                ? "Close public navigation"
                : "Open public navigation"
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => {
              setIsMobileMenuOpen((currentValue) => !currentValue);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="public-mobile-navigation"
        className={[
          "public-header-mobile-navigation",
          isMobileMenuOpen ? "public-header-mobile-navigation--open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <PublicNavigation
          variant="public-mobile"
          onNavigate={handlePublicNavigation}
        />

        <div className="public-header-mobile-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="public-header-primary-action">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="public-header-secondary-action"
                onClick={(event) => {
                  handleAuthenticationNavigation(event, "/auth/login");
                }}
              >
                Sign In
              </Link>

              <Link
                to="/auth/register"
                className="public-header-primary-action"
                onClick={(event) => {
                  handleAuthenticationNavigation(event, "/auth/register");
                }}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
