import { useEffect } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import "./About.css";

function About() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "About | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-eyebrow">About the platform</span>

          <h1>Your career information, strengthened by AI assistance.</h1>

          <p>
            Portfolio Platform combines structured career management with
            responsible AI assistance. It helps people organize their
            experience, communicate their value, and generate professional
            resumes and portfolios without losing control of their story.
          </p>

          <div className="about-hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="about-primary-action">
                Open Dashboard
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link to="/auth/register" className="about-primary-action">
                  Create Your Account
                  <span aria-hidden="true">→</span>
                </Link>

                <Link to="/auth/login" className="about-secondary-action">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="about-hero-visual" aria-hidden="true">
          <div className="about-visual-card about-visual-card--profile">
            <span>Structured information</span>
            <strong>Your career records in one workspace</strong>

            <div className="about-visual-lines">
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="about-visual-card about-visual-card--portfolio">
            <span>AI-assisted generation</span>
            <strong>Resume and portfolio drafts in one click</strong>

            <div className="about-visual-projects">
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="about-visual-badge">
            <strong>✦</strong>
            <span>You review and approve</span>
          </div>
        </div>
      </section>

      <section className="about-mission">
        <div className="about-section-heading">
          <span>Our mission</span>

          <h2>Make professional growth easier to organize and present.</h2>
        </div>

        <div className="about-mission-content">
          <p>
            Career information is often scattered across resumes, applications,
            online profiles, documents, and personal files. Portfolio Platform
            brings it into one reusable workspace.
          </p>

          <p>
            AI assistance helps users improve descriptions, identify useful
            details, and prepare tailored materials. The user reviews the result
            and decides what is saved, included, or published.
          </p>
        </div>
      </section>

      <section className="about-principles">
        <div className="about-section-heading about-section-heading--centered">
          <span>Platform principles</span>

          <h2>Useful intelligence with human control.</h2>

          <p>
            AI accelerates the work, but your information, decisions, and
            professional identity remain yours.
          </p>
        </div>

        <div className="about-principle-grid">
          <article>
            <span className="about-principle-number">01</span>
            <h3>Your information belongs to you</h3>
            <p>
              Private career records remain separate from anything you
              intentionally publish.
            </p>
          </article>

          <article>
            <span className="about-principle-number">02</span>
            <h3>AI assists throughout the workspace</h3>
            <p>
              Receive contextual help with profiles, achievements, projects,
              skills, resumes, and portfolios.
            </p>
          </article>

          <article>
            <span className="about-principle-number">03</span>
            <h3>You approve the final result</h3>
            <p>
              Generated content is a draft. You can review, edit, accept, or
              reject it before use.
            </p>
          </article>

          <article>
            <span className="about-principle-number">04</span>
            <h3>Security is part of the design</h3>
            <p>
              Verification, secure sessions, private records, and controlled
              publishing help protect your account.
            </p>
          </article>
        </div>
      </section>

      <section className="about-audience">
        <div className="about-audience-introduction">
          <span className="about-eyebrow">Who it supports</span>

          <h2>Professional guidance for every career stage.</h2>

          <p>
            The platform supports people who need help organizing their
            experience and presenting it clearly.
          </p>
        </div>

        <div className="about-audience-list">
          <article>
            <span>01</span>

            <div>
              <h3>Students and recent graduates</h3>
              <p>
                Turn education, training, projects, and early experience into
                professional career materials.
              </p>
            </div>
          </article>

          <article>
            <span>02</span>

            <div>
              <h3>Experienced professionals</h3>
              <p>
                Transform years of responsibilities and achievements into a
                clear, focused presentation.
              </p>
            </div>
          </article>

          <article>
            <span>03</span>

            <div>
              <h3>Independent professionals</h3>
              <p>
                Present services, technical abilities, projects, and evidence of
                completed work.
              </p>
            </div>
          </article>

          <article>
            <span>04</span>

            <div>
              <h3>Career changers</h3>
              <p>
                Use AI assistance to connect transferable skills, new training,
                and projects into one coherent story.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="about-call-to-action">
        <div>
          <span className="about-eyebrow">Your story, your decisions</span>

          <h2>Organize once. Improve with AI. Present with confidence.</h2>

          <p>
            Build your professional record and turn it into a resume or
            portfolio whenever the next opportunity appears.
          </p>
        </div>

        <Link
          to={isAuthenticated ? "/dashboard" : "/auth/register"}
          className="about-primary-action"
        >
          {isAuthenticated ? "Continue to Dashboard" : "Create Your Account"}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}

export default About;
