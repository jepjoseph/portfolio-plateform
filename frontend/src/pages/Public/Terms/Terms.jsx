import { useEffect } from "react";

import { Link } from "react-router-dom";

import "../Privacy/Privacy.css";

/*
 * =========================================
 * Terms Information
 * =========================================
 */

const TERMS_EFFECTIVE_DATE = "September 19, 2026";
const TERMS_LAST_UPDATED = "September 19, 2026";

/*
 * =========================================
 * Terms Page
 * =========================================
 */

function Terms() {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Terms of Use | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <article className="legal-page">
      {/*
       * =====================================
       * Header
       * =====================================
       */}

      <header className="legal-page-header">
        <span className="legal-eyebrow">
          Platform rules and responsibilities
        </span>

        <h1>Terms of Use</h1>

        <p>
          These terms explain the responsibilities associated with creating an
          account, using AI assistance, maintaining professional content,
          generating career materials, publishing portfolios, and interacting
          with opportunities or support services.
        </p>

        <dl className="legal-document-information">
          <div>
            <dt>Effective date</dt>
            <dd>{TERMS_EFFECTIVE_DATE}</dd>
          </div>

          <div>
            <dt>Last updated</dt>
            <dd>{TERMS_LAST_UPDATED}</dd>
          </div>

          <div>
            <dt>Current status</dt>
            <dd>Development terms</dd>
          </div>
        </dl>

        <div className="legal-draft-notice" role="note">
          <span aria-hidden="true">i</span>

          <p>
            These terms are a development draft describing the intended platform
            rules. They require professional legal review before becoming the
            final agreement for a production service.
          </p>
        </div>
      </header>

      {/*
       * =====================================
       * Navigation
       * =====================================
       */}

      <nav
        className="legal-table-of-contents"
        aria-label="Terms of use sections"
      >
        <strong>On this page</strong>

        <ol>
          <li>
            <a href="#terms-acceptance">Acceptance</a>
          </li>

          <li>
            <a href="#terms-account">Accounts and security</a>
          </li>

          <li>
            <a href="#terms-content">User content</a>
          </li>

          <li>
            <a href="#terms-ai">AI assistance</a>
          </li>

          <li>
            <a href="#terms-resumes">Resumes and portfolios</a>
          </li>

          <li>
            <a href="#terms-opportunities">Opportunities</a>
          </li>

          <li>
            <a href="#terms-conduct">Acceptable use</a>
          </li>

          <li>
            <a href="#terms-third-parties">Third-party services</a>
          </li>

          <li>
            <a href="#terms-availability">Availability</a>
          </li>

          <li>
            <a href="#terms-termination">Suspension and termination</a>
          </li>

          <li>
            <a href="#terms-contact">Contact</a>
          </li>
        </ol>
      </nav>

      {/*
       * =====================================
       * Terms Body
       * =====================================
       */}

      <div className="legal-content">
        <section id="terms-acceptance">
          <span className="legal-section-number">01</span>

          <h2>Acceptance of these terms</h2>

          <p>
            By creating an account or using Portfolio Platform, a user agrees to
            follow the applicable Terms of Use and Privacy Policy.
          </p>

          <p>
            A user who does not agree with the applicable terms should not
            create an account, submit information, use AI features, or publish a
            portfolio.
          </p>
        </section>

        <section id="terms-eligibility">
          <span className="legal-section-number">02</span>

          <h2>Eligibility</h2>

          <p>
            Users must be legally capable of entering into the applicable
            agreement or have legally sufficient authorization from a parent or
            guardian.
          </p>

          <p>
            The minimum permitted age and any regional restrictions must be
            finalized before production launch based on where the platform is
            offered.
          </p>
        </section>

        <section id="terms-account">
          <span className="legal-section-number">03</span>

          <h2>Accounts and security</h2>

          <p>Users are responsible for:</p>

          <ul>
            <li>Providing accurate account information.</li>

            <li>Maintaining control of their email account and devices.</li>

            <li>Choosing a secure password and keeping it private.</li>

            <li>
              Never sharing one-time verification codes or session values.
            </li>

            <li>Promptly reporting suspected unauthorized access.</li>

            <li>
              Ensuring that activity performed through their account complies
              with these terms.
            </li>
          </ul>

          <p>
            Portfolio Platform personnel should never request a user’s password,
            one-time verification code, or complete authentication cookie.
          </p>
        </section>

        <section id="terms-content">
          <span className="legal-section-number">04</span>

          <h2>User content and ownership</h2>

          <p>
            Users retain ownership of professional information, text, images,
            documents, projects, and other content they lawfully submit.
          </p>

          <p>
            Users must have the necessary rights and permissions to upload,
            store, generate from, and publish their content. Content must not
            violate another person’s intellectual-property, privacy,
            confidentiality, publicity, or contractual rights.
          </p>

          <p>
            Users grant Portfolio Platform only the permissions reasonably
            necessary to store, process, display, generate, export, and publish
            content according to their instructions and platform settings.
          </p>

          <div className="legal-important-note">
            <strong>Confidential employer information</strong>

            <p>
              Users should not upload or publish trade secrets, private source
              code, confidential client information, restricted documents, or
              other material they are not authorized to disclose.
            </p>
          </div>
        </section>

        <section id="terms-ai">
          <span className="legal-section-number">05</span>

          <h2>AI-assisted features</h2>

          <p>
            AI features may generate drafts, summaries, recommendations,
            rewrites, resume content, portfolio content, or opportunity-related
            suggestions.
          </p>

          <p>
            AI output may be incomplete, inaccurate, inappropriate, outdated, or
            similar to content generated for other users. AI output is not
            guaranteed to be unique, correct, or suitable for a particular
            purpose.
          </p>

          <p>Users are responsible for:</p>

          <ul>
            <li>Reviewing every generated result.</li>

            <li>
              Verifying facts, dates, credentials, technologies, and
              achievements.
            </li>

            <li>
              Removing exaggerations, invented qualifications, or unsupported
              claims.
            </li>

            <li>
              Ensuring that submitted or published materials accurately
              represent their background.
            </li>

            <li>
              Complying with employer, school, application, and professional
              rules governing AI-assisted content.
            </li>
          </ul>

          <p>
            AI assistance does not constitute legal, financial, immigration,
            employment, educational, or other professional advice.
          </p>
        </section>

        <section id="terms-resumes">
          <span className="legal-section-number">06</span>

          <h2>Resumes and public portfolios</h2>

          <p>
            Generated resumes and portfolios are drafts created from selected
            information. Users must review the final content and presentation
            before downloading, submitting, sharing, or publishing it.
          </p>

          <p>
            Publishing a portfolio makes selected information accessible to
            visitors. Users are responsible for confirming that published
            content is accurate, appropriate, and free of information that
            should remain private.
          </p>

          <p>
            Portfolio Platform does not guarantee employment, interviews,
            admissions, contracts, clients, partnerships, or other outcomes.
          </p>
        </section>

        <section id="terms-opportunities">
          <span className="legal-section-number">07</span>

          <h2>Opportunity information</h2>

          <p>
            Future opportunity features may display jobs, internships, learning
            programs, partnerships, events, or other third-party information.
          </p>

          <p>
            Users must independently evaluate opportunity legitimacy,
            eligibility, requirements, deadlines, compensation, safety, and
            suitability before applying or sharing information.
          </p>

          <p>
            AI relevance suggestions do not guarantee qualification, acceptance,
            availability, or accuracy. Sponsored or promoted opportunities
            should be clearly labeled and distinguished from relevance-based
            suggestions.
          </p>
        </section>

        <section id="terms-conduct">
          <span className="legal-section-number">08</span>

          <h2>Acceptable use</h2>

          <p>Users must not:</p>

          <ul>
            <li>
              Attempt to access another user’s account or private records.
            </li>

            <li>Share passwords, verification codes, or session tokens.</li>

            <li>
              Submit malware, harmful code, automated abuse, or excessive
              requests.
            </li>

            <li>
              Circumvent authorization, rate limits, security measures, or
              access restrictions.
            </li>

            <li>
              Use the platform for fraud, impersonation, harassment, unlawful
              discrimination, or other illegal activity.
            </li>

            <li>
              Generate or publish deliberately false credentials,
              qualifications, employment history, or achievements.
            </li>

            <li>Collect or misuse information from public portfolios.</li>

            <li>
              Interfere with platform availability, integrity, or security.
            </li>
          </ul>
        </section>

        <section id="terms-third-parties">
          <span className="legal-section-number">09</span>

          <h2>Third-party services and links</h2>

          <p>
            Portfolio Platform may rely on hosting, database, email, AI,
            analytics, storage, or other service providers and may link to
            third-party websites.
          </p>

          <p>
            Third-party services are governed by their own terms and policies.
            Portfolio Platform does not control third-party availability,
            content, security, or business practices.
          </p>
        </section>

        <section id="terms-availability">
          <span className="legal-section-number">10</span>

          <h2>Platform availability and changes</h2>

          <p>
            Features may be added, modified, limited, suspended, or removed
            during development and after launch. The platform may experience
            maintenance, provider outages, errors, or interruptions.
          </p>

          <p>
            Users should retain independent copies of important resume,
            portfolio, credential, and career information.
          </p>
        </section>

        <section id="terms-termination">
          <span className="legal-section-number">11</span>

          <h2>Suspension and termination</h2>

          <p>
            Access may be limited or suspended when reasonably necessary to
            protect users, investigate abuse, comply with law, address security
            threats, or enforce platform rules.
          </p>

          <p>
            Final production terms should define account-deletion, cancellation,
            appeal, data-export, and post-termination retention procedures.
          </p>
        </section>

        <section id="terms-disclaimers">
          <span className="legal-section-number">12</span>

          <h2>Disclaimers and liability</h2>

          <p>
            The platform, generated content, recommendations, templates,
            opportunity information, and public publishing features are provided
            for general career-management purposes.
          </p>

          <p>
            Final warranty disclaimers, limitations of liability,
            indemnification terms, dispute procedures, governing law, and venue
            must be prepared or approved by qualified legal counsel before
            production launch.
          </p>
        </section>

        <section id="terms-changes">
          <span className="legal-section-number">13</span>

          <h2>Changes to these terms</h2>

          <p>
            Terms may be updated as platform functionality, providers, business
            practices, or legal requirements change. The last-updated date
            should identify the current published version.
          </p>

          <p>
            Material changes may require additional notice or renewed
            acceptance.
          </p>
        </section>

        <section id="terms-contact">
          <span className="legal-section-number">14</span>

          <h2>Questions about these terms</h2>

          <p>
            Questions concerning platform rules or these terms can be submitted
            through the Contact page.
          </p>

          <Link to="/contact" className="legal-primary-action">
            Contact Portfolio Platform
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>

      <footer className="legal-related-links">
        <div>
          <span className="legal-eyebrow">Related information</span>

          <h2>Understand how information is processed.</h2>
        </div>

        <Link to="/privacy" className="legal-secondary-action">
          Read the Privacy Policy
          <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}

export default Terms;
