import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import "./HowItWorks.css";

const workflowSections = [
  {
    id: "account",
    eyebrow: "01 · Secure account",
    title: "Create and protect your workspace.",
    description:
      "Verify your email, create a secure password, and use two-step verification when signing in.",
    media: "/media/demos/secure-registration.gif",
    instructions: [
      "Enter your email address.",
      "Confirm the six-digit verification code.",
      "Create a secure password.",
      "Sign in and verify the login code.",
    ],
  },
  {
    id: "profile",
    eyebrow: "02 · Professional profile",
    title: "Introduce yourself professionally.",
    description:
      "Add your information and use AI assistance to create a clear professional title, introduction, and summary.",
    media: "/media/demos/profile-ai.gif",
    instructions: [
      "Enter your basic professional details.",
      "Describe your goals in your own words.",
      "Ask AI to improve the wording.",
      "Review and approve the final version.",
    ],
  },
  {
    id: "experience",
    eyebrow: "03 · Experience and achievements",
    title: "Explain the value of your work.",
    description:
      "AI helps transform responsibilities, accomplishments, tools, and measurable outcomes into professional descriptions.",
    media: "/media/demos/experience-ai.gif",
    instructions: [
      "Add your position and organization.",
      "Describe your responsibilities.",
      "Include achievements and outcomes.",
      "Use AI to improve clarity and impact.",
    ],
  },
  {
    id: "development",
    eyebrow: "04 · Professional development",
    title: "Organize everything you have learned.",
    description:
      "Maintain education, training, skills, and certifications while AI helps identify useful connections and descriptions.",
    media: "/media/demos/career-development-ai.gif",
    instructions: [
      "Add education and training.",
      "Record certifications and credentials.",
      "Organize technical and professional skills.",
      "Review AI suggestions before saving.",
    ],
  },
  {
    id: "projects",
    eyebrow: "05 · Projects",
    title: "Show what you can actually build.",
    description:
      "Document goals, challenges, technologies, responsibilities, results, links, and media with guided AI assistance.",
    media: "/media/demos/projects-ai.gif",
    instructions: [
      "Describe the project and its purpose.",
      "Connect relevant skills and experience.",
      "Add technologies, outcomes, and media.",
      "Let AI prepare a polished project summary.",
    ],
  },
  {
    id: "resume",
    eyebrow: "06 · Résumé generation",
    title: "Generate a focused résumé in one click.",
    description:
      "Choose a target role and relevant career records. AI prepares a tailored résumé draft using information already in your workspace.",
    media: "/media/demos/resume-ai.gif",
    instructions: [
      "Choose the target opportunity.",
      "Select relevant career information.",
      "Generate the résumé draft.",
      "Review, customize, and export it.",
    ],
  },
  {
    id: "portfolio",
    eyebrow: "07 · Portfolio generation",
    title: "Generate a professional portfolio in one click.",
    description:
      "Select what you want visitors to see and let AI organize it into a polished portfolio presentation.",
    media: "/media/demos/portfolio-ai.gif",
    instructions: [
      "Choose the records you want to present.",
      "Select your portfolio structure.",
      "Generate and preview the portfolio.",
      "Approve the content before publishing.",
    ],
  },
];

function WorkflowMedia({ section }) {
  const [hasMediaError, setHasMediaError] = useState(false);

  useEffect(() => {
    setHasMediaError(false);
  }, [section.id]);

  return (
    <div className="how-workflow-media">
      {!hasMediaError ? (
        <img
          src={section.media}
          alt={`${section.title} demonstration`}
          onError={() => {
            setHasMediaError(true);
          }}
        />
      ) : (
        <div className="how-workflow-media-placeholder" aria-hidden="true">
          <div className="how-placeholder-browser">
            <div className="how-placeholder-header">
              <i />
              <i />
              <i />

              <span>AI-assisted workspace</span>
            </div>

            <div className="how-placeholder-body">
              <span>✦ AI suggestion</span>

              <i />
              <i />
              <i />

              <button type="button" tabIndex="-1">
                Generate draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowSection({ section, index }) {
  return (
    <section
      className={`how-workflow-section ${
        index % 2 === 1 ? "how-workflow-section--reverse" : ""
      }`}
    >
      <div className="how-workflow-demonstration">
        <WorkflowMedia section={section} />

        <span className="how-workflow-caption">
          Replace with: <code>{section.media}</code>
        </span>
      </div>

      <div className="how-workflow-content">
        <span className="how-it-works-eyebrow">{section.eyebrow}</span>

        <h2>{section.title}</h2>

        <p>{section.description}</p>

        <ol>
          {section.instructions.map((instruction) => (
            <li key={instruction}>
              <span aria-hidden="true">✓</span>
              <p>{instruction}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "How It Works | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="how-it-works-page">
      <section className="how-it-works-hero">
        <span className="how-it-works-eyebrow">
          AI assistance from beginning to publication
        </span>

        <h1>Build everything with guidance. Generate when you are ready.</h1>

        <p>
          Portfolio Platform helps you complete every part of your professional
          workspace. AI can improve your content along the way, then generate a
          focused résumé or professional portfolio using the information you
          have approved.
        </p>

        <div className="how-it-works-control-note">
          <span aria-hidden="true">✦</span>

          <p>
            AI-generated content remains a draft until you review and approve
            it. Nothing should be published automatically.
          </p>
        </div>

        <div className="how-it-works-hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="how-it-works-primary-action">
              Continue to Dashboard
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <>
              <Link to="/auth/register" className="how-it-works-primary-action">
                Create Your Account
                <span aria-hidden="true">→</span>
              </Link>

              <Link to="/auth/login" className="how-it-works-secondary-action">
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="how-it-works-overview">
          <div>
            <span>01</span>
            <strong>Create securely</strong>
          </div>

          <i aria-hidden="true">→</i>

          <div>
            <span>02</span>
            <strong>Build with AI</strong>
          </div>

          <i aria-hidden="true">→</i>

          <div>
            <span>03</span>
            <strong>Generate materials</strong>
          </div>

          <i aria-hidden="true">→</i>

          <div>
            <span>04</span>
            <strong>Review and publish</strong>
          </div>
        </div>
      </section>

      <div className="how-workflow-list">
        {workflowSections.map((section, index) => (
          <WorkflowSection key={section.id} section={section} index={index} />
        ))}
      </div>

      <section className="how-privacy-section">
        <div className="how-privacy-content">
          <span className="how-it-works-eyebrow">
            Private and user-controlled
          </span>

          <h2>Your workspace and public portfolio remain separate.</h2>

          <p>
            AI may help prepare content, but information in your authenticated
            workspace is not automatically public. You decide what belongs in a
            résumé, what appears in your portfolio, and when anything is
            published.
          </p>
        </div>

        <div className="how-privacy-comparison">
          <article>
            <span aria-hidden="true">🔒</span>

            <div>
              <strong>Private workspace</strong>

              <p>
                Complete records, drafts, AI suggestions, settings, sessions,
                and private documents.
              </p>
            </div>
          </article>

          <article>
            <span aria-hidden="true">◇</span>

            <div>
              <strong>Public portfolio</strong>

              <p>
                Only the information you select, review, approve, and
                intentionally publish.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="how-it-works-call-to-action">
        <div>
          <span className="how-it-works-eyebrow">
            Your professional AI assistant
          </span>

          <h2>Build once, improve continuously, and generate in one click.</h2>

          <p>
            Keep your career information current so AI can help you prepare
            relevant résumés and portfolios whenever opportunities appear.
          </p>
        </div>

        <Link
          to={isAuthenticated ? "/dashboard" : "/auth/register"}
          className="how-it-works-primary-action"
        >
          {isAuthenticated ? "Open Dashboard" : "Create Your Account"}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}

export default HowItWorks;
