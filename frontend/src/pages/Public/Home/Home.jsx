import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import "./Home.css";

/*
 * =========================================
 * Product Demonstrations
 * =========================================
 *
 * Add the real GIF files later under:
 *
 * frontend/public/media/demos/
 */

const productDemonstrations = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "See your professional progress",
    description:
      "Review your profile, recent activity, career records, resumes, and portfolio from one organized workspace.",
    media: "/media/demos/dashboard-ai.gif",
  },
  {
    id: "profile",
    label: "AI profile assistance",
    title: "Build a stronger professional profile",
    description:
      "Use guided AI assistance to improve your introduction, professional title, summary, and other profile information.",
    media: "/media/demos/profile-ai.gif",
  },
  {
    id: "experience",
    label: "AI writing assistance",
    title: "Turn responsibilities into achievements",
    description:
      "Describe what you did in your own words, then let AI help you create clear, professional, results-focused content.",
    media: "/media/demos/experience-ai.gif",
  },
  {
    id: "projects",
    label: "Project assistance",
    title: "Present projects with confidence",
    description:
      "Organize project goals, technologies, contributions, outcomes, and supporting media with AI-guided suggestions.",
    media: "/media/demos/projects-ai.gif",
  },
  {
    id: "development",
    label: "Complete career record",
    title: "Organize education, training, and skills",
    description:
      "Keep education, training, certifications, and skills connected to the professional story you want to present.",
    media: "/media/demos/career-development-ai.gif",
  },
  {
    id: "portfolio",
    label: "One-click generation",
    title: "Generate your portfolio",
    description:
      "Select your information, choose a presentation, and let AI prepare a professional portfolio draft for your review.",
    media: "/media/demos/portfolio-ai.gif",
  },
  {
    id: "resume",
    label: "One-click generation",
    title: "Generate a targeted resume",
    description:
      "Use your structured career information to produce a focused resume draft for a specific opportunity.",
    media: "/media/demos/resume-ai.gif",
  },
];

/*
 * =========================================
 * Demonstration Media
 * =========================================
 */

function DemonstrationMedia({ demonstration }) {
  const [hasMediaError, setHasMediaError] = useState(false);

  useEffect(() => {
    setHasMediaError(false);
  }, [demonstration.id]);

  return (
    <div className="public-home-demo-media">
      {!hasMediaError ? (
        <img
          src={demonstration.media}
          alt={`${demonstration.title} demonstration`}
          onError={() => {
            setHasMediaError(true);
          }}
        />
      ) : (
        <div className="public-home-demo-placeholder" aria-hidden="true">
          <div className="public-home-demo-window">
            <div className="public-home-demo-window-header">
              <i />
              <i />
              <i />
            </div>

            <div className="public-home-demo-window-body">
              <div className="public-home-demo-sidebar">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className="public-home-demo-content">
                <span className="public-home-demo-ai-badge">AI assistance</span>

                <i className="public-home-demo-heading-line" />
                <i />
                <i />
                <i />

                <div className="public-home-demo-action">
                  <span>Generating professional content</span>
                  <strong>✦</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * =========================================
 * Home
 * =========================================
 */

function Home() {
  const { isAuthenticated } = useAuth();

  const [activeDemonstrationIndex, setActiveDemonstrationIndex] = useState(0);

  const activeDemonstration = productDemonstrations[activeDemonstrationIndex];

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Portfolio Platform | Build Your Career with AI";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * Automatically move to the next product
   * demonstration every seven seconds.
   */

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveDemonstrationIndex(
        (currentIndex) => (currentIndex + 1) % productDemonstrations.length,
      );
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="public-home">
      <section className="public-home-hero">
        <div
          className="public-home-product-demo"
          aria-label="Platform demonstration"
        >
          <div className="public-home-demo-copy">
            <span>{activeDemonstration.label}</span>

            <h2>{activeDemonstration.title}</h2>

            <p>{activeDemonstration.description}</p>
          </div>

          <DemonstrationMedia demonstration={activeDemonstration} />

          <div
            className="public-home-demo-controls"
            role="tablist"
            aria-label="Select a product demonstration"
          >
            {productDemonstrations.map((demonstration, index) => (
              <button
                key={demonstration.id}
                type="button"
                className={index === activeDemonstrationIndex ? "active" : ""}
                onClick={() => {
                  setActiveDemonstrationIndex(index);
                }}
                role="tab"
                aria-selected={index === activeDemonstrationIndex}
                aria-label={`Show ${demonstration.title}`}
              >
                <span>{demonstration.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="public-home-hero-copy">
          <span className="public-home-eyebrow">
            AI-assisted career management
          </span>

          <h1>Build your professional story with AI assistance.</h1>

          <p>
            Organize your career information once, receive intelligent guidance
            throughout every section, and generate a tailored resume or
            professional portfolio in one click.
          </p>

          <div className="public-home-ai-note">
            <span aria-hidden="true">✦</span>

            <p>
              AI helps you draft, improve, and organize your content. You remain
              in control and approve everything before it is used or published.
            </p>
          </div>

          <div className="public-home-hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="public-home-hero-primary">
                Open Your Workspace
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link to="/auth/register" className="public-home-hero-primary">
                  Create Your Account
                  <span aria-hidden="true">→</span>
                </Link>

                <Link to="/auth/login" className="public-home-hero-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="public-home-features" aria-label="Platform features">
        <article>
          <span aria-hidden="true">01</span>

          <h2>Build with AI guidance</h2>

          <p>
            Complete your profile, experience, projects, education, training,
            skills, and certifications with contextual writing assistance.
          </p>
        </article>

        <article>
          <span aria-hidden="true">02</span>

          <h2>Generate targeted resumes</h2>

          <p>
            Transform your structured career records into a focused resume draft
            for a role or opportunity in one click.
          </p>
        </article>

        <article>
          <span aria-hidden="true">03</span>

          <h2>Generate your portfolio</h2>

          <p>
            Select the work you want to present and generate a polished
            portfolio draft that remains under your control.
          </p>
        </article>
      </section>
    </div>
  );
}

export default Home;
