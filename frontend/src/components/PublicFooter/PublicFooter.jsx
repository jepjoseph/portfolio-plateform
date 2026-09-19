import { Link } from "react-router-dom";

import "./PublicFooter.css";

function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <Link to="/">Portfolio Platform</Link>

          <p>Build, manage, and present your professional story.</p>
        </div>

        <div className="public-footer-columns">
          <section>
            <h2>Platform</h2>

            <nav aria-label="Footer platform navigation">
              <Link to="/">Home</Link>

              <Link to="/about">About</Link>

              <Link to="/how-it-works">How It Works</Link>

              <Link to="/opportunities">Opportunities</Link>
            </nav>
          </section>

          <section>
            <h2>Support</h2>

            <nav aria-label="Footer support navigation">
              <Link to="/support">Support</Link>

              <Link to="/contact">Contact</Link>
            </nav>
          </section>

          <section>
            <h2>Legal</h2>

            <nav aria-label="Footer legal navigation">
              <span aria-disabled="true">Privacy</span>

              <span aria-disabled="true">Terms</span>
            </nav>
          </section>
        </div>
      </div>

      <div className="public-footer-bottom">
        <p>© {currentYear} Portfolio Platform</p>

        <p>Professional career management in one secure workspace.</p>
      </div>
    </footer>
  );
}

export default PublicFooter;
