import { useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import "./NotFound.css";

/*
 * =========================================
 * Not Found Page
 * =========================================
 */

function NotFound() {
  const location = useLocation();

  const navigate = useNavigate();

  const { isAuthenticated, isInitializing } = useAuth();

  /*
   * =========================================
   * Document Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Page Not Found | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Previous Page
   * =========================================
   */

  function handleGoBack() {
    /*
     * A directly opened URL may not have a
     * useful application-history entry.
     */

    if (window.history.length > 1) {
      navigate(-1);

      return;
    }

    navigate("/", {
      replace: true,
    });
  }

  return (
    <div className="not-found-page">
      <section className="not-found-content" aria-labelledby="not-found-title">
        {/*
         * =====================================
         * Visual
         * =====================================
         */}

        <div className="not-found-visual" aria-hidden="true">
          <span className="not-found-code">404</span>

          <div className="not-found-orbit not-found-orbit--one" />

          <div className="not-found-orbit not-found-orbit--two" />

          <div className="not-found-marker">?</div>
        </div>

        {/*
         * =====================================
         * Explanation
         * =====================================
         */}

        <div className="not-found-message">
          <span className="not-found-eyebrow">Page not found</span>

          <h1 id="not-found-title">
            This page is not part of the current path.
          </h1>

          <p>
            The address may be incorrect, the page may have moved, or the
            requested feature may not be available yet.
          </p>

          <div
            className="not-found-requested-path"
            aria-label="Requested address"
          >
            <span>Requested path</span>

            <code>
              {location.pathname}
              {location.search}
            </code>
          </div>

          {/*
           * =====================================
           * Primary Actions
           * =====================================
           */}

          <div className="not-found-actions">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="not-found-primary-action"
            >
              {isAuthenticated ? "Open Dashboard" : "Return Home"}

              <span aria-hidden="true">→</span>
            </Link>

            <button
              type="button"
              className="not-found-secondary-action"
              onClick={handleGoBack}
            >
              <span aria-hidden="true">←</span>
              Go Back
            </button>
          </div>

          {isInitializing ? (
            <p className="not-found-auth-status" role="status">
              Checking your current session...
            </p>
          ) : null}
        </div>
      </section>

      {/*
       * =====================================
       * Recovery Links
       * =====================================
       */}

      <section
        className="not-found-recovery"
        aria-labelledby="not-found-recovery-title"
      >
        <div className="not-found-recovery-heading">
          <span className="not-found-eyebrow">Continue from here</span>

          <h2 id="not-found-recovery-title">Choose a valid destination.</h2>
        </div>

        <div className="not-found-recovery-grid">
          <Link to="/">
            <span aria-hidden="true">⌂</span>

            <div>
              <strong>Home</strong>

              <p>Return to the public Portfolio Platform homepage.</p>
            </div>

            <i aria-hidden="true">→</i>
          </Link>

          <Link to="/how-it-works">
            <span aria-hidden="true">◇</span>

            <div>
              <strong>How It Works</strong>

              <p>Learn how AI assistance, résumés, and portfolios work.</p>
            </div>

            <i aria-hidden="true">→</i>
          </Link>

          <Link to="/support">
            <span aria-hidden="true">?</span>

            <div>
              <strong>Support</strong>

              <p>
                Search account, AI, résumé, portfolio, and security guidance.
              </p>
            </div>

            <i aria-hidden="true">→</i>
          </Link>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <span aria-hidden="true">◈</span>

              <div>
                <strong>Dashboard</strong>

                <p>Continue working in your private professional workspace.</p>
              </div>

              <i aria-hidden="true">→</i>
            </Link>
          ) : (
            <Link to="/auth/login">
              <span aria-hidden="true">◎</span>

              <div>
                <strong>Sign In</strong>

                <p>Access your private professional workspace.</p>
              </div>

              <i aria-hidden="true">→</i>
            </Link>
          )}
        </div>
      </section>

      {/*
       * =====================================
       * Contact Recovery
       * =====================================
       */}

      <section className="not-found-contact">
        <div>
          <span className="not-found-eyebrow">Is a link broken?</span>

          <h2>Let us know what you were trying to open.</h2>

          <p>
            If you reached this page through a Portfolio Platform link, you can
            submit the requested address through the contact page.
          </p>
        </div>

        <Link to="/contact" className="not-found-secondary-action">
          Contact Support
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}

export default NotFound;
