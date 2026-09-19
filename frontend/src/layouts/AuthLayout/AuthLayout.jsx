import { useLocation, useNavigate } from "react-router-dom";

import { Link, Outlet } from "react-router-dom";

import PublicNavigation from "../../components/PublicNavigation/PublicNavigation.jsx";

import {
  ROUTE_TRANSITION_DURATION_MS,
  runRouteTransition,
} from "../../utils/routeTransition.js";

import "./AuthLayout.css";

/*
 * =========================================
 * Modified Click Detection
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
 * Authentication Layout
 * =========================================
 */

function AuthLayout() {
  const navigate = useNavigate();

  const location = useLocation();

  const currentYear = new Date().getFullYear();

  /*
   * =========================================
   * Transition to Destination
   * =========================================
   */

  function transitionToDestination(destination) {
    runRouteTransition(
      () => {
        navigate(destination);
      },
      {
        name: "reveal-from-left",

        duration: ROUTE_TRANSITION_DURATION_MS,
      },
    );
  }

  /*
   * =========================================
   * Home Navigation
   * =========================================
   */

  function handleHomeNavigation(event) {
    if (isModifiedNavigation(event)) {
      return;
    }

    event.preventDefault();

    transitionToDestination("/");
  }

  function handlePublicNavigation(event, navigationItem) {
    if (navigationItem?.path === "/") {
      handleHomeNavigation(event);
    }
  }

  /*
   * =========================================
   * Go Back
   * =========================================
   *
   * location.key is "default" when the page
   * was opened directly and there may be no
   * safe application history entry.
   */

  function handleGoBack() {
    runRouteTransition(
      () => {
        if (location.key === "default") {
          navigate("/");
        } else {
          navigate(-1);
        }
      },
      {
        name: "reveal-from-left",

        duration: ROUTE_TRANSITION_DURATION_MS,
      },
    );
  }

  return (
    <div
      className="auth-layout"
      style={{
        "--auth-transition-duration": `${ROUTE_TRANSITION_DURATION_MS}ms`,
      }}
    >
      {/*
       * =====================================
       * Platform Presentation
       * =====================================
       */}

      <aside className="auth-layout-presentation">
        <div className="auth-layout-presentation-home">
          <PublicNavigation
            variant="auth"
            onNavigate={handlePublicNavigation}
          />
        </div>

        <div className="auth-layout-presentation-content">
          <Link
            to="/"
            className="auth-layout-brand"
            aria-label="Portfolio Platform home"
            onClick={handleHomeNavigation}
          >
            <span className="auth-layout-brand-mark" aria-hidden="true">
              PP
            </span>

            <span className="auth-layout-brand-text">
              <strong>Portfolio Platform</strong>

              <small>Build. Present. Grow.</small>
            </span>
          </Link>

          <div className="auth-layout-introduction">
            <span className="auth-layout-eyebrow">
              Your professional workspace
            </span>

            <h1>Build a career presence that grows with you.</h1>

            <p>
              Organize your professional profile, experience, projects, skills,
              certifications, résumés, and public portfolio from one secure
              platform.
            </p>
          </div>

          <div className="auth-layout-feature-list">
            <div className="auth-layout-feature">
              <span className="auth-layout-feature-icon" aria-hidden="true">
                01
              </span>

              <div>
                <strong>One professional profile</strong>

                <p>
                  Keep your career information organized and ready to reuse.
                </p>
              </div>
            </div>

            <div className="auth-layout-feature">
              <span className="auth-layout-feature-icon" aria-hidden="true">
                02
              </span>

              <div>
                <strong>Résumés built with purpose</strong>

                <p>
                  Create focused résumés using the experience and skills you
                  already manage.
                </p>
              </div>
            </div>

            <div className="auth-layout-feature">
              <span className="auth-layout-feature-icon" aria-hidden="true">
                03
              </span>

              <div>
                <strong>A portfolio ready to share</strong>

                <p>
                  Publish selected work through a professional public
                  presentation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-layout-presentation-footer">
          <span aria-hidden="true">◈</span>

          <p>
            Your account is protected with password verification and a one-time
            email code.
          </p>
        </div>
      </aside>

      {/*
       * =====================================
       * Authentication Area
       * =====================================
       */}

      <main className="auth-layout-main">
        <header className="auth-layout-main-header">
          <div className="auth-layout-mobile-home">
            <PublicNavigation
              variant="auth"
              onNavigate={handlePublicNavigation}
            />
          </div>

          <button
            type="button"
            className="auth-layout-back-button"
            onClick={handleGoBack}
          >
            <span aria-hidden="true">←</span>
            Go back
          </button>
        </header>

        <div className="auth-layout-content">
          <div className="auth-layout-mobile-brand">
            <Link
              to="/"
              className="auth-layout-brand"
              aria-label="Portfolio Platform home"
              onClick={handleHomeNavigation}
            >
              <span className="auth-layout-brand-mark" aria-hidden="true">
                PP
              </span>

              <span className="auth-layout-brand-text">
                <strong>Portfolio Platform</strong>

                <small>Build. Present. Grow.</small>
              </span>
            </Link>
          </div>

          <div className="auth-layout-outlet">
            <Outlet />
          </div>

          <div className="auth-layout-security-note" role="note">
            <span className="auth-layout-security-icon" aria-hidden="true">
              ✓
            </span>

            <p>
              Passwords and verification codes are never displayed or emailed
              back to you. Always keep your sign-in information private.
            </p>
          </div>
        </div>

        <footer className="auth-layout-footer">
          <p>© {currentYear} Portfolio Platform</p>

          <nav aria-label="Authentication legal links">
            <Link to="/privacy">Privacy</Link>

            <Link to="/terms">Terms</Link>

            <Link to="/contact">Help</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}

export default AuthLayout;
