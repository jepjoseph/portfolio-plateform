import { useEffect } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import "./Opportunities.css";

/*
 * =========================================
 * Opportunity Categories
 * =========================================
 */

const opportunityCategories = [
  {
    id: "career",
    number: "01",
    icon: "◈",
    title: "Career opportunities",
    description:
      "Discover employment, internship, freelance, contract, and professional-development opportunities.",
    examples: [
      "Full-time and part-time positions",
      "Internships and apprenticeships",
      "Freelance and contract projects",
      "Remote and local opportunities",
    ],
  },
  {
    id: "learning",
    number: "02",
    icon: "◇",
    title: "Learning opportunities",
    description:
      "Find programs that can strengthen your knowledge, credentials, and professional direction.",
    examples: [
      "Courses and training programs",
      "Scholarships and fellowships",
      "Certifications and workshops",
      "Conferences and professional events",
    ],
  },
  {
    id: "partnerships",
    number: "03",
    icon: "◎",
    title: "Partnership opportunities",
    description:
      "Connect with organizations, collaborators, mentors, and professionals working toward compatible goals.",
    examples: [
      "Project collaboration",
      "Mentorship opportunities",
      "Professional communities",
      "Organization partnerships",
    ],
  },
];

/*
 * =========================================
 * AI Discovery Steps
 * =========================================
 */

const aiDiscoverySteps = [
  {
    number: "01",
    title: "Understand your professional profile",
    description:
      "With your permission, AI can use the skills, experience, education, projects, interests, and preferences stored in your workspace.",
  },
  {
    number: "02",
    title: "Identify relevant opportunities",
    description:
      "The platform can compare available opportunities with your approved professional information and explain potential connections.",
  },
  {
    number: "03",
    title: "Explain why something may fit",
    description:
      "Instead of displaying an unexplained score, the platform can identify matching skills, possible gaps, and areas worth reviewing.",
  },
  {
    number: "04",
    title: "Prepare your application materials",
    description:
      "Use your existing records to generate a focused resume, portfolio selection, or application draft for the opportunity.",
  },
];

/*
 * =========================================
 * Opportunities Page
 * =========================================
 */

function Opportunities() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Opportunities | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="opportunities-page">
      {/*
       * =====================================
       * Hero
       * =====================================
       */}

      <section className="opportunities-hero">
        <div className="opportunities-hero-content">
          <span className="opportunities-eyebrow">
            AI-assisted opportunity discovery
          </span>

          <h1>Find opportunities that connect with your professional story.</h1>

          <p>
            Portfolio Platform is preparing an opportunity center designed to
            connect career records with relevant jobs, learning programs,
            partnerships, and professional announcements.
          </p>

          <div className="opportunities-status">
            <span aria-hidden="true">✦</span>

            <div>
              <strong>Opportunity discovery is coming soon</strong>

              <p>
                This page currently explains the planned experience. Live
                listings, recommendations, and applications are not active yet.
              </p>
            </div>
          </div>

          <div className="opportunities-hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="opportunities-primary-action">
                Continue to Dashboard
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/register"
                  className="opportunities-primary-action"
                >
                  Build Your Professional Profile
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  to="/auth/login"
                  className="opportunities-secondary-action"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div
          className="opportunities-hero-visual"
          aria-label="Planned AI opportunity discovery preview"
        >
          <div className="opportunities-preview-window">
            <div className="opportunities-preview-header">
              <div>
                <i />
                <i />
                <i />
              </div>

              <span>Opportunity discovery</span>
            </div>

            <div className="opportunities-preview-body">
              <div className="opportunities-preview-search">
                <span aria-hidden="true">⌕</span>

                <p>Opportunities related to your profile</p>

                <strong>AI</strong>
              </div>

              <div className="opportunities-preview-result">
                <div className="opportunities-preview-result-heading">
                  <span>Career opportunity</span>

                  <strong>Strong connection</strong>
                </div>

                <h2>Technology and engineering role</h2>

                <p>
                  Your projects, technical skills, and professional experience
                  may connect with this opportunity.
                </p>

                <div className="opportunities-preview-tags">
                  <span>Technical skills</span>
                  <span>Projects</span>
                  <span>Experience</span>
                </div>
              </div>

              <div className="opportunities-preview-explanation">
                <span aria-hidden="true">✦</span>

                <p>
                  AI would explain the connection and identify information to
                  review before you apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
       * =====================================
       * Categories
       * =====================================
       */}

      <section className="opportunities-categories">
        <div className="opportunities-section-heading">
          <span className="opportunities-eyebrow">More than job listings</span>

          <h2>Explore different ways to grow professionally.</h2>

          <p>
            The opportunity center is planned to support career advancement,
            continuing education, and meaningful professional collaboration.
          </p>
        </div>

        <div className="opportunities-category-grid">
          {opportunityCategories.map((category) => (
            <article key={category.id}>
              <div className="opportunities-category-heading">
                <span className="opportunities-category-icon">
                  {category.icon}
                </span>

                <span className="opportunities-category-number">
                  {category.number}
                </span>
              </div>

              <h3>{category.title}</h3>

              <p>{category.description}</p>

              <ul>
                {category.examples.map((example) => (
                  <li key={example}>
                    <span aria-hidden="true">✓</span>
                    {example}
                  </li>
                ))}
              </ul>

              <div className="opportunities-coming-soon">Coming soon</div>
            </article>
          ))}
        </div>
      </section>

      {/*
       * =====================================
       * AI Discovery
       * =====================================
       */}

      <section className="opportunities-ai-discovery">
        <div className="opportunities-ai-introduction">
          <span className="opportunities-eyebrow">
            Responsible AI assistance
          </span>

          <h2>
            Recommendations should be useful, understandable, and under your
            control.
          </h2>

          <p>
            Future AI assistance is intended to help users explore
            opportunities—not make employment decisions, guarantee
            qualification, or submit applications without permission.
          </p>

          <div className="opportunities-ai-principle">
            <span aria-hidden="true">✦</span>

            <p>
              You decide which information can be used, which recommendations to
              consider, and which materials to generate.
            </p>
          </div>
        </div>

        <div className="opportunities-ai-steps">
          {aiDiscoverySteps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>

              <div>
                <h3>{step.title}</h3>

                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/*
       * =====================================
       * Application Preparation
       * =====================================
       */}

      <section className="opportunities-preparation">
        <div className="opportunities-preparation-heading">
          <span className="opportunities-eyebrow">
            From discovery to preparation
          </span>

          <h2>Turn an opportunity into focused career materials.</h2>

          <p>
            Once you identify an opportunity, your structured career records can
            help you prepare without rewriting everything from the beginning.
          </p>
        </div>

        <div className="opportunities-preparation-flow">
          <article>
            <span>01</span>
            <strong>Review the opportunity</strong>
            <p>
              Understand its responsibilities, requirements, and intended
              audience.
            </p>
          </article>

          <i aria-hidden="true">→</i>

          <article>
            <span>02</span>
            <strong>Select relevant records</strong>
            <p>
              Choose the experience, skills, education, and projects that
              support your application.
            </p>
          </article>

          <i aria-hidden="true">→</i>

          <article>
            <span>03</span>
            <strong>Generate with AI</strong>
            <p>
              Prepare a targeted resume or portfolio draft using your approved
              information.
            </p>
          </article>

          <i aria-hidden="true">→</i>

          <article>
            <span>04</span>
            <strong>Review and apply</strong>
            <p>
              Verify every detail, make your changes, and decide how to proceed.
            </p>
          </article>
        </div>
      </section>

      {/*
       * =====================================
       * Sponsored Opportunities
       * =====================================
       */}

      <section className="opportunities-sponsored">
        <div className="opportunities-sponsored-content">
          <span className="opportunities-eyebrow">
            Transparency for promoted content
          </span>

          <h2>Sponsored opportunities will always be clearly labeled.</h2>

          <p>
            Organizations may eventually be able to promote relevant programs,
            opportunities, services, or events. Paid placement should never be
            presented as an independent AI recommendation.
          </p>
        </div>

        <div className="opportunities-sponsored-example">
          <div className="opportunities-sponsored-label">Sponsored</div>

          <span>Example promoted opportunity</span>

          <h3>Professional development program</h3>

          <p>
            Paid content would be visually identified so users can distinguish
            sponsorship from relevance-based discovery.
          </p>

          <small>Demonstration only—not an active promotion.</small>
        </div>
      </section>

      {/*
       * =====================================
       * Current State
       * =====================================
       */}

      <section className="opportunities-current-state">
        <div className="opportunities-empty-state">
          <span aria-hidden="true">◇</span>

          <div>
            <strong>No live opportunities are available yet</strong>

            <p>
              The opportunity center is being prepared. Continue building your
              professional profile so your records are ready for future
              discovery and application tools.
            </p>
          </div>
        </div>
      </section>

      {/*
       * =====================================
       * Call to Action
       * =====================================
       */}

      <section className="opportunities-call-to-action">
        <div>
          <span className="opportunities-eyebrow">
            Prepare before the opportunity appears
          </span>

          <h2>Build the professional record AI can help you use.</h2>

          <p>
            Keep your experience, skills, education, certifications, and
            projects current so you can generate focused materials when
            opportunity discovery becomes available.
          </p>
        </div>

        <Link
          to={isAuthenticated ? "/dashboard" : "/auth/register"}
          className="opportunities-primary-action"
        >
          {isAuthenticated ? "Continue to Dashboard" : "Create Your Account"}

          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}

export default Opportunities;
