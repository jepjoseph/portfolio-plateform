import { Link, Outlet } from "react-router-dom";

import "./AuthLayout.css";

/*
 * =========================================
 * Authentication Layout
 * =========================================
 */

function AuthLayout() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="auth-layout">
      {/*
       * =====================================
       * Platform Presentation
       * =====================================
       */}

      <aside className="auth-layout-presentation">
        <div className="auth-layout-presentation-content">
          <Link
            to="/"
            className="auth-layout-brand"
            aria-label="Portfolio Platform home"
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
       * Authentication Content
       * =====================================
       */}

      <main className="auth-layout-main">
        <header className="auth-layout-main-header">
          <Link to="/" className="auth-layout-back-link">
            <span aria-hidden="true">←</span>
            Return to homepage
          </Link>
        </header>

        <div className="auth-layout-content">
          <div className="auth-layout-mobile-brand">
            <Link
              to="/"
              className="auth-layout-brand"
              aria-label="Portfolio Platform home"
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
