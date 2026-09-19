import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import "./Support.css";

/*
 * =========================================
 * Support Categories
 * =========================================
 */

const supportCategories = [
  {
    id: "all",
    label: "All topics",
  },
  {
    id: "account",
    label: "Account & sign in",
  },
  {
    id: "profile",
    label: "Profile & records",
  },
  {
    id: "ai",
    label: "AI assistance",
  },
  {
    id: "resume",
    label: "Résumés",
  },
  {
    id: "portfolio",
    label: "Portfolios",
  },
  {
    id: "privacy",
    label: "Privacy & security",
  },
];

/*
 * =========================================
 * Support Articles
 * =========================================
 */

const supportArticles = [
  {
    id: "create-account",
    category: "account",
    title: "How do I create an account?",
    summary:
      "Register using an email address, verify the six-digit code, and create a secure password.",
    steps: [
      "Select Create Account from the public website.",
      "Enter an email address you can access.",
      "Enter the six-digit verification code before it expires.",
      "Create and confirm a password that meets the security requirements.",
      "Return to Sign In after registration is completed.",
    ],
  },
  {
    id: "sign-in",
    category: "account",
    title: "How does secure sign-in work?",
    summary:
      "Signing in requires your password and a separate email verification code.",
    steps: [
      "Enter your verified email address and password.",
      "Check your email for the six-digit login code.",
      "Enter the code before it expires.",
      "After verification, the browser receives a secure session cookie.",
    ],
  },
  {
    id: "verification-code",
    category: "account",
    title: "What should I do if my verification code does not work?",
    summary:
      "Confirm that the code is complete, has not expired, and belongs to your latest request.",
    steps: [
      "Use the most recently issued six-digit code.",
      "Enter the code before the displayed expiration time.",
      "Make sure all six digits were entered correctly.",
      "Return to the previous form and request a new challenge if the code expired.",
    ],
  },
  {
    id: "signed-out",
    category: "account",
    title: "Why was I signed out?",
    summary:
      "A session can end because it expired, was revoked, or no longer matches the browser cookie.",
    steps: [
      "Return to the Sign In page.",
      "Enter your email and password.",
      "Complete the email verification step.",
      "If the problem continues, wait briefly and try again before contacting support.",
    ],
  },
  {
    id: "build-profile",
    category: "profile",
    title: "What information should I add first?",
    summary:
      "Begin with your profile, then add experience, education, skills, projects, and professional development.",
    steps: [
      "Complete your basic profile and professional title.",
      "Add your most recent or relevant experience.",
      "Record education, training, and certifications.",
      "Organize your skills.",
      "Add projects that demonstrate how you applied those skills.",
    ],
  },
  {
    id: "career-records",
    category: "profile",
    title: "Why should I maintain separate career records?",
    summary:
      "Structured records can be reused across different résumés and portfolio presentations.",
    steps: [
      "Keep complete information in your private workspace.",
      "Update records as your responsibilities and achievements change.",
      "Select only relevant records when creating a résumé.",
      "Publish only information intended for public visitors.",
    ],
  },
  {
    id: "ai-help",
    category: "ai",
    title: "How can AI help me complete my information?",
    summary:
      "AI can help organize ideas, improve wording, and prepare professional drafts based on information you provide.",
    steps: [
      "Enter accurate facts about your background and work.",
      "Choose the AI assistance option available in the section.",
      "Review the generated suggestion carefully.",
      "Edit anything that does not accurately represent your experience.",
      "Approve the content only when you are satisfied with it.",
    ],
  },
  {
    id: "ai-accuracy",
    category: "ai",
    title: "Can I trust AI-generated content automatically?",
    summary:
      "No. AI-generated content should always be treated as a draft requiring your review.",
    steps: [
      "Verify names, dates, organizations, technologies, and credentials.",
      "Remove statements that exaggerate your responsibilities or results.",
      "Confirm that every achievement is supported by your real experience.",
      "Edit the tone so it represents you naturally.",
      "Never submit or publish generated content without reviewing it.",
    ],
  },
  {
    id: "ai-control",
    category: "ai",
    title: "Does AI publish or change my information automatically?",
    summary:
      "AI assistance should create suggestions and drafts, not make final publishing decisions.",
    steps: [
      "Review generated content before saving it.",
      "Choose which records belong in each résumé or portfolio.",
      "Preview public content before publishing.",
      "Return to your workspace whenever information needs to be corrected.",
    ],
  },
  {
    id: "generate-resume",
    category: "resume",
    title: "How will one-click résumé generation work?",
    summary:
      "The platform will use selected career records to prepare a focused résumé draft.",
    steps: [
      "Choose the role or opportunity you are targeting.",
      "Select relevant experience, skills, education, and projects.",
      "Choose Generate Résumé.",
      "Review the AI-generated draft.",
      "Customize and export the final version.",
    ],
  },
  {
    id: "resume-targeting",
    category: "resume",
    title: "Why should I create different résumés?",
    summary:
      "Different opportunities emphasize different experience, achievements, and skills.",
    steps: [
      "Review the responsibilities and requirements of the opportunity.",
      "Prioritize your most relevant professional records.",
      "Remove information that distracts from the target role.",
      "Use AI assistance to improve focus without inventing qualifications.",
    ],
  },
  {
    id: "generate-portfolio",
    category: "portfolio",
    title: "How will one-click portfolio generation work?",
    summary:
      "The platform will organize selected profile and project information into a portfolio draft.",
    steps: [
      "Choose the profile information you want visitors to see.",
      "Select relevant projects, skills, and experience.",
      "Choose a portfolio presentation.",
      "Generate and review the draft.",
      "Publish only after verifying every public section.",
    ],
  },
  {
    id: "public-portfolio",
    category: "portfolio",
    title: "Is everything in my workspace shown publicly?",
    summary:
      "No. Private workspace records and public portfolio content serve different purposes.",
    steps: [
      "Your authenticated workspace contains your complete records.",
      "Portfolio generation uses only the information you select.",
      "Preview the portfolio before publishing.",
      "Confirm that private contact or account information is excluded.",
    ],
  },
  {
    id: "password-codes",
    category: "privacy",
    title: "Can the platform show me my password or verification code?",
    summary:
      "Passwords should never be recoverable, and verification codes are temporary security values.",
    steps: [
      "Never share your password or verification code.",
      "Portfolio Platform support should never ask for your password.",
      "Use only codes generated for your own sign-in or registration request.",
      "If you suspect unauthorized access, sign out and secure your email account.",
    ],
  },
  {
    id: "session-cookie",
    category: "privacy",
    title: "How does the browser session work?",
    summary:
      "The browser uses a secure HttpOnly cookie that application JavaScript cannot read.",
    steps: [
      "The cookie is created only after successful login verification.",
      "The browser sends it automatically with authorized requests.",
      "Refreshing a session replaces the previous refresh token.",
      "Logging out revokes the server session and clears the cookie.",
    ],
  },
  {
    id: "public-private",
    category: "privacy",
    title: "How do I protect private career information?",
    summary:
      "Review visibility choices carefully and publish only information appropriate for public visitors.",
    steps: [
      "Keep complete records in the authenticated workspace.",
      "Avoid publishing private addresses or sensitive identification data.",
      "Preview every portfolio change.",
      "Remove public information that is no longer necessary.",
    ],
  },
];

/*
 * =========================================
 * Text Normalization
 * =========================================
 */

function normalizeSearchText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/*
 * =========================================
 * Support Article
 * =========================================
 */

function SupportArticle({ article, isOpen, onToggle }) {
  const contentId = `support-article-${article.id}`;

  return (
    <article
      className={`support-article ${isOpen ? "support-article--open" : ""}`}
    >
      <button
        type="button"
        className="support-article-button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="support-article-heading">
          <span>{article.title}</span>

          <small>{article.summary}</small>
        </span>

        <span className="support-article-toggle" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div id={contentId} className="support-article-content">
          <ol>
            {article.steps.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>

                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </article>
  );
}

/*
 * =========================================
 * Support Page
 * =========================================
 */

function Support() {
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [openArticleId, setOpenArticleId] = useState(null);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Support | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    return supportArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === "all" || article.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableContent = [
        article.title,
        article.summary,
        ...article.steps,
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(normalizedQuery);
    });
  }, [searchQuery, selectedCategory]);

  function handleCategoryChange(categoryId) {
    setSelectedCategory(categoryId);
    setOpenArticleId(null);
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSelectedCategory("all");
    setOpenArticleId(null);
  }

  return (
    <div className="support-page">
      {/*
       * =====================================
       * Hero
       * =====================================
       */}

      <section className="support-hero">
        <span className="support-eyebrow">Help and guidance</span>

        <h1>Find the information you need to keep moving forward.</h1>

        <p>
          Search guidance for account access, professional records, AI
          assistance, résumé generation, portfolio publishing, privacy, and
          security.
        </p>

        <div className="support-search">
          <span className="support-search-icon" aria-hidden="true">
            ⌕
          </span>

          <label htmlFor="support-search-input" className="support-sr-only">
            Search support topics
          </label>

          <input
            id="support-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setOpenArticleId(null);
            }}
            placeholder="Search account, AI, résumé, portfolio, or security..."
            autoComplete="off"
          />

          {searchQuery ? (
            <button
              type="button"
              className="support-search-clear"
              onClick={() => {
                setSearchQuery("");
              }}
              aria-label="Clear support search"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="support-hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="support-primary-action">
              Open Dashboard
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <>
              <Link to="/auth/register" className="support-primary-action">
                Create Your Account
                <span aria-hidden="true">→</span>
              </Link>

              <Link to="/auth/login" className="support-secondary-action">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/*
       * =====================================
       * Quick Guidance
       * =====================================
       */}

      <section className="support-quick-guidance">
        <article>
          <span aria-hidden="true">01</span>

          <div>
            <h2>Account access</h2>

            <p>
              Registration, verification codes, secure sign-in, sessions, and
              logout.
            </p>
          </div>
        </article>

        <article>
          <span aria-hidden="true">02</span>

          <div>
            <h2>AI assistance</h2>

            <p>
              Learn how to use generated suggestions responsibly and maintain
              control.
            </p>
          </div>
        </article>

        <article>
          <span aria-hidden="true">03</span>

          <div>
            <h2>Career materials</h2>

            <p>
              Prepare professional records for résumé and portfolio generation.
            </p>
          </div>
        </article>
      </section>

      {/*
       * =====================================
       * Knowledge Base
       * =====================================
       */}

      <section className="support-knowledge-base">
        <div className="support-knowledge-heading">
          <span className="support-eyebrow">Support knowledge base</span>

          <h2>Browse guidance by topic.</h2>

          <p>Select a category or search across all available guidance.</p>
        </div>

        <div className="support-category-list" aria-label="Support categories">
          {supportCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={selectedCategory === category.id ? "active" : ""}
              onClick={() => {
                handleCategoryChange(category.id);
              }}
              aria-pressed={selectedCategory === category.id}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="support-results-summary" aria-live="polite">
          <p>
            {filteredArticles.length === 1
              ? "1 support topic found"
              : `${filteredArticles.length} support topics found`}
          </p>

          {searchQuery || selectedCategory !== "all" ? (
            <button type="button" onClick={handleClearSearch}>
              Clear filters
            </button>
          ) : null}
        </div>

        {filteredArticles.length > 0 ? (
          <div className="support-article-list">
            {filteredArticles.map((article) => (
              <SupportArticle
                key={article.id}
                article={article}
                isOpen={openArticleId === article.id}
                onToggle={() => {
                  setOpenArticleId((currentId) =>
                    currentId === article.id ? null : article.id,
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className="support-no-results">
            <span aria-hidden="true">⌕</span>

            <h3>No matching guidance was found</h3>

            <p>
              Try fewer words, select another category, or clear your search
              filters.
            </p>

            <button type="button" onClick={handleClearSearch}>
              Show all support topics
            </button>
          </div>
        )}
      </section>

      {/*
       * =====================================
       * AI Safety Reminder
       * =====================================
       */}

      <section className="support-ai-reminder">
        <div className="support-ai-reminder-icon" aria-hidden="true">
          ✦
        </div>

        <div>
          <span className="support-eyebrow">Using AI responsibly</span>

          <h2>AI assistance creates drafts—not verified facts.</h2>

          <p>
            Always confirm dates, credentials, organizations, responsibilities,
            technologies, and achievements. You are responsible for ensuring
            that generated content accurately represents your background.
          </p>
        </div>

        <Link to="/how-it-works" className="support-secondary-action">
          See How It Works
        </Link>
      </section>

      {/*
       * =====================================
       * Contact Escalation
       * =====================================
       */}

      <section className="support-contact">
        <div>
          <span className="support-eyebrow">Still need assistance?</span>

          <h2>Some issues require direct support.</h2>

          <p>
            The dedicated contact page will provide a secure way to submit
            account, technical, privacy, and general support requests.
          </p>
        </div>

        <Link to="/contact" className="support-primary-action">
          Contact Support
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <p className="support-security-warning">
        Portfolio Platform support should never ask for your password,
        verification code, or complete session token.
      </p>
    </div>
  );
}

export default Support;
