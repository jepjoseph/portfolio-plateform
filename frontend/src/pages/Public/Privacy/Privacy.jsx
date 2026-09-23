import { useEffect } from "react";

import { Link } from "react-router-dom";

import "./Privacy.css";

/*
 * =========================================
 * Policy Information
 * =========================================
 */

const POLICY_EFFECTIVE_DATE = "September 19, 2026";
const POLICY_LAST_UPDATED = "September 19, 2026";

/*
 * =========================================
 * Privacy Page
 * =========================================
 */

function Privacy() {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Privacy Policy | Portfolio Platform";

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
        <span className="legal-eyebrow">Privacy and data practices</span>

        <h1>Privacy Policy</h1>

        <p>
          This policy explains the information Portfolio Platform processes, why
          it is needed, and the choices users have when managing career records,
          AI-assisted content, resumes, portfolios, and support requests.
        </p>

        <dl className="legal-document-information">
          <div>
            <dt>Effective date</dt>
            <dd>{POLICY_EFFECTIVE_DATE}</dd>
          </div>

          <div>
            <dt>Last updated</dt>
            <dd>{POLICY_LAST_UPDATED}</dd>
          </div>

          <div>
            <dt>Current status</dt>
            <dd>Development policy</dd>
          </div>
        </dl>

        <div className="legal-draft-notice" role="note">
          <span aria-hidden="true">i</span>

          <p>
            This policy describes the platform’s current design and intended
            practices during development. It must receive professional legal
            review before being treated as a final production privacy policy.
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
        aria-label="Privacy policy sections"
      >
        <strong>On this page</strong>

        <ol>
          <li>
            <a href="#privacy-scope">Scope</a>
          </li>

          <li>
            <a href="#privacy-information">Information we process</a>
          </li>

          <li>
            <a href="#privacy-use">How information is used</a>
          </li>

          <li>
            <a href="#privacy-ai">AI-assisted features</a>
          </li>

          <li>
            <a href="#privacy-cookies">Cookies and sessions</a>
          </li>

          <li>
            <a href="#privacy-public">Public portfolios</a>
          </li>

          <li>
            <a href="#privacy-sharing">Information sharing</a>
          </li>

          <li>
            <a href="#privacy-retention">Retention and deletion</a>
          </li>

          <li>
            <a href="#privacy-security">Security</a>
          </li>

          <li>
            <a href="#privacy-choices">Your choices</a>
          </li>

          <li>
            <a href="#privacy-contact">Contact</a>
          </li>
        </ol>
      </nav>

      {/*
       * =====================================
       * Policy Body
       * =====================================
       */}

      <div className="legal-content">
        <section id="privacy-scope">
          <span className="legal-section-number">01</span>

          <h2>Scope of this policy</h2>

          <p>
            This policy applies to information processed through Portfolio
            Platform’s public website, account registration, authentication,
            private career workspace, resume tools, portfolio tools, AI-assisted
            features, opportunity features, and support-request system.
          </p>

          <p>
            It does not automatically apply to third-party websites, services,
            employers, learning providers, or other organizations linked from
            the platform.
          </p>
        </section>

        <section id="privacy-information">
          <span className="legal-section-number">02</span>

          <h2>Information we process</h2>

          <h3>Account and authentication information</h3>

          <p>
            Account information may include an email address, email-verification
            status, password hash, account status, roles, registration
            challenges, login challenges, and security timestamps. Passwords
            should be stored only as one-way password hashes.
          </p>

          <h3>Professional and career information</h3>

          <p>
            Users may provide profile information, professional summaries,
            contact details, employment experience, education, training,
            certifications, skills, projects, accomplishments, documents, links,
            images, resume content, and portfolio content.
          </p>

          <h3>AI-assisted information</h3>

          <p>
            AI features may process instructions, selected career records,
            drafts, generated suggestions, feedback, and other content required
            to provide the requested assistance.
          </p>

          <h3>Contact and support information</h3>

          <p>
            Contact requests may include a name, email address, request
            category, subject, message, consent to receive a response, request
            status, and submission time.
          </p>

          <h3>Technical and security information</h3>

          <p>
            The platform may process browser user-agent information, session
            metadata, timestamps, request activity, security events, and
            cryptographic hashes derived from IP addresses. The current contact
            request design stores an IP-address hash rather than the raw IP
            address.
          </p>
        </section>

        <section id="privacy-use">
          <span className="legal-section-number">03</span>

          <h2>How information is used</h2>

          <p>Information may be used to:</p>

          <ul>
            <li>Create and manage user accounts.</li>

            <li>Verify email ownership and authenticate sign-ins.</li>

            <li>Maintain secure browser sessions.</li>

            <li>Store and organize professional records.</li>

            <li>Generate and improve resume and portfolio drafts.</li>

            <li>Provide requested AI-assisted functionality.</li>

            <li>
              Publish information intentionally selected for a public portfolio.
            </li>

            <li>
              Receive, review, and respond to contact or support requests.
            </li>

            <li>Detect abuse, investigate errors, and protect the platform.</li>

            <li>
              Improve accessibility, reliability, and product functionality.
            </li>
          </ul>
        </section>

        <section id="privacy-ai">
          <span className="legal-section-number">04</span>

          <h2>AI-assisted features</h2>

          <p>
            AI assistance may help users draft, organize, summarize, rewrite, or
            tailor professional content. When an AI feature is requested,
            selected information may be sent to the configured AI service
            provider to produce a response.
          </p>

          <div className="legal-important-note">
            <strong>User review is required</strong>

            <p>
              AI output may contain errors, omissions, inappropriate wording, or
              unsupported claims. Users must verify generated content before
              saving, exporting, submitting, or publishing it.
            </p>
          </div>

          <p>
            Portfolio Platform should send only the information reasonably
            necessary to perform the requested AI function. Passwords, one-time
            verification codes, session tokens, and authentication cookies must
            not be included in AI prompts.
          </p>

          <p>
            Before production launch, this policy must identify active AI
            providers and accurately describe their retention, processing, and
            model-training practices based on the applicable service agreements.
          </p>
        </section>

        <section id="privacy-cookies">
          <span className="legal-section-number">05</span>

          <h2>Cookies and authenticated sessions</h2>

          <p>
            Portfolio Platform uses a refresh-token cookie to maintain an
            authenticated session. The cookie is configured as HttpOnly so
            frontend JavaScript cannot read its value directly.
          </p>

          <p>
            Session tokens may be rotated during refresh operations. Logging out
            revokes the corresponding server-side session and instructs the
            browser to remove the cookie.
          </p>

          <p>
            Additional optional analytics or preference cookies should not be
            introduced without updating this policy and providing any legally
            required controls.
          </p>
        </section>

        <section id="privacy-public">
          <span className="legal-section-number">06</span>

          <h2>Public portfolios</h2>

          <p>
            Career records in the authenticated workspace are intended to remain
            private unless a user intentionally selects and publishes them.
          </p>

          <p>
            Information included in a published portfolio may be accessible to
            anyone with access to its public address. Public information may be
            copied, indexed, shared, or retained by third parties outside
            Portfolio Platform’s control.
          </p>

          <p>
            Users should preview portfolios carefully and avoid publishing
            private addresses, personal identification numbers, confidential
            employer information, private documents, or other sensitive data.
          </p>
        </section>

        <section id="privacy-sharing">
          <span className="legal-section-number">07</span>

          <h2>How information may be shared</h2>

          <p>Information may be shared:</p>

          <ul>
            <li>
              With service providers necessary to host, secure, maintain, or
              operate the platform.
            </li>

            <li>
              With configured AI providers when a user requests an AI-assisted
              feature.
            </li>

            <li>
              With visitors when a user intentionally publishes information.
            </li>

            <li>
              When required by applicable law, legal process, or a valid
              government request.
            </li>

            <li>
              When reasonably necessary to investigate fraud, abuse, security
              threats, or violations of platform rules.
            </li>

            <li>
              As part of a legitimate business reorganization, subject to
              appropriate protections and notice where required.
            </li>
          </ul>

          <p>
            Portfolio Platform should not describe personal information as being
            sold unless its actual business and advertising practices have been
            reviewed under applicable privacy laws.
          </p>
        </section>

        <section id="privacy-retention">
          <span className="legal-section-number">08</span>

          <h2>Retention and deletion</h2>

          <p>
            Information should be retained only as long as reasonably needed for
            account functionality, user-requested services, security, support,
            legal obligations, dispute resolution, and enforcement.
          </p>

          <p>
            Different records may require different retention periods. For
            example, active sessions expire automatically, while security or
            support records may be retained longer when reasonably necessary.
          </p>

          <p>
            Before production launch, documented retention schedules and
            account-deletion procedures should be established for account
            records, AI content, uploaded files, published portfolios, contact
            requests, logs, and backups.
          </p>
        </section>

        <section id="privacy-security">
          <span className="legal-section-number">09</span>

          <h2>Security</h2>

          <p>
            The platform uses measures intended to protect information,
            including password hashing, one-time verification codes, HttpOnly
            cookies, refresh-token hashing, token rotation, authorization
            checks, request validation, rate limiting, security headers, and
            encrypted database connections.
          </p>

          <p>
            No system can guarantee absolute security. Users must protect their
            email accounts, passwords, devices, and verification codes and
            should report suspected unauthorized access.
          </p>
        </section>

        <section id="privacy-choices">
          <span className="legal-section-number">10</span>

          <h2>Your choices and requests</h2>

          <p>
            Depending on platform functionality and applicable law, users may
            request access to, correction of, export of, or deletion of certain
            information.
          </p>

          <p>
            Users can control what they enter into their workspace and what they
            choose to publish. Published information should be removed when it
            is no longer intended for public access.
          </p>

          <p>
            Identity verification may be required before completing a privacy
            request. Portfolio Platform should never request a password or
            one-time verification code through an ordinary support message.
          </p>
        </section>

        <section id="privacy-children">
          <span className="legal-section-number">11</span>

          <h2>Children’s privacy</h2>

          <p>
            Portfolio Platform is intended for professional and career
            management and is not designed for children under 13. The platform
            should not knowingly collect personal information from children
            under 13 without legally sufficient authorization.
          </p>

          <p>
            Age requirements may need to be adjusted before production based on
            the countries where the service is offered.
          </p>
        </section>

        <section id="privacy-changes">
          <span className="legal-section-number">12</span>

          <h2>Changes to this policy</h2>

          <p>
            This policy may be updated as the platform, providers, legal
            requirements, or data practices change. The updated date should be
            revised whenever material changes are published.
          </p>

          <p>
            Material changes may require additional notice through the website,
            account interface, or email.
          </p>
        </section>

        <section id="privacy-contact">
          <span className="legal-section-number">13</span>

          <h2>Contact and privacy questions</h2>

          <p>
            Questions about this policy or requests concerning personal
            information can be submitted through the Contact page.
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

          <h2>Review the platform terms as well.</h2>
        </div>

        <Link to="/terms" className="legal-secondary-action">
          Read the Terms
          <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}

export default Privacy;
