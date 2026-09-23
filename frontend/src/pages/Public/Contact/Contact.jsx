import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

import { submitContactRequest } from "../../../services/Support/contactService.js";

import "./Contact.css";

/*
 * =========================================
 * Configuration
 * =========================================
 */

const MAXIMUM_NAME_LENGTH = 120;
const MAXIMUM_EMAIL_LENGTH = 320;
const MAXIMUM_SUBJECT_LENGTH = 160;
const MAXIMUM_MESSAGE_LENGTH = 5000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * =========================================
 * Public Contact Information
 * =========================================
 *
 * Replace these values before publishing.
 *
 * The phone link must contain digits and an
 * optional leading + only. Do not include
 * parentheses, spaces, or hyphens in it.
 */

const PUBLIC_CONTACT_EMAIL = "jeanpierre.joseph5@gmail.com";

const PUBLIC_CONTACT_PHONE_DISPLAY = "+1 (954) 795-7778";

const PUBLIC_CONTACT_PHONE_LINK = "+19547957778";

const PUBLIC_CONTACT_AVAILABILITY =
  "Responses are normally provided within 1–2 business days.";

/*
 * =========================================
 * Request Categories
 * =========================================
 */

const requestCategories = [
  {
    value: "account_access",
    label: "Account access",
    description:
      "Registration, verification codes, sign-in, sessions, or logout.",
  },
  {
    value: "profile_records",
    label: "Profile and career records",
    description:
      "Profile, experience, education, training, skills, or certifications.",
  },
  {
    value: "ai_assistance",
    label: "AI assistance",
    description:
      "Generated suggestions, content accuracy, or AI feature behavior.",
  },
  {
    value: "resume",
    label: "Resume assistance",
    description:
      "Resume creation, generation, customization, preview, or export.",
  },
  {
    value: "portfolio",
    label: "Portfolio assistance",
    description:
      "Portfolio creation, preview, publishing, or public visibility.",
  },
  {
    value: "privacy_security",
    label: "Privacy or security",
    description: "Privacy questions, suspicious access, or security concerns.",
  },
  {
    value: "partnership",
    label: "Partnership inquiry",
    description:
      "Organizations, educators, employers, or professional collaborators.",
  },
  {
    value: "feedback",
    label: "Feedback or suggestion",
    description:
      "Product feedback, feature ideas, accessibility, or general suggestions.",
  },
  {
    value: "other",
    label: "Other request",
    description: "A request that does not match one of the listed categories.",
  },
];

/*
 * =========================================
 * Authenticated User Prefill
 * =========================================
 */

function getUserName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  const directName = [user.displayName, user.fullName, user.name].find(
    (value) => typeof value === "string" && value.trim(),
  );

  if (directName) {
    return directName.trim();
  }

  const combinedName = [user.firstName, user.lastName]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim())
    .join(" ");

  return combinedName;
}

function getUserEmail(user) {
  return typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
}

/*
 * =========================================
 * Initial Form
 * =========================================
 */

function createInitialForm(user) {
  return {
    name: getUserName(user),
    email: getUserEmail(user),
    category: "",
    subject: "",
    message: "",
    replyConsent: false,
  };
}

/*
 * =========================================
 * Validation
 * =========================================
 */

function validateContactForm(form) {
  const errors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const subject = form.subject.trim();
  const message = form.message.trim();

  if (!name) {
    errors.name = "Enter your name.";
  } else if (name.length > MAXIMUM_NAME_LENGTH) {
    errors.name = `Name cannot contain more than ${MAXIMUM_NAME_LENGTH} characters.`;
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > MAXIMUM_EMAIL_LENGTH) {
    errors.email = "Email address is too long.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.category) {
    errors.category = "Select the type of request.";
  }

  if (!subject) {
    errors.subject = "Enter a short subject.";
  } else if (subject.length > MAXIMUM_SUBJECT_LENGTH) {
    errors.subject = `Subject cannot contain more than ${MAXIMUM_SUBJECT_LENGTH} characters.`;
  }

  if (!message) {
    errors.message = "Describe how we can help.";
  } else if (message.length < 20) {
    errors.message =
      "Include at least 20 characters so the request can be understood.";
  } else if (message.length > MAXIMUM_MESSAGE_LENGTH) {
    errors.message = `Message cannot contain more than ${MAXIMUM_MESSAGE_LENGTH} characters.`;
  }

  if (!form.replyConsent) {
    errors.replyConsent =
      "Confirm that we may use your email address to respond.";
  }

  return errors;
}

/*
 * =========================================
 * Backend-Ready Payload
 * =========================================
 *
 * This structure can later be passed to:
 *
 * POST /api/support/contact
 *
 * Do not add session tokens, cookies, passwords,
 * OTPs, or browser security values to this body.
 */

function createContactPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    category: form.category,
    subject: form.subject.trim(),
    message: form.message.trim(),
    replyConsent: Boolean(form.replyConsent),
  };
}

/*
 * =========================================
 * First Field Error
 * =========================================
 */

function getFieldError(errors, fieldName) {
  return typeof errors?.[fieldName] === "string" ? errors[fieldName] : "";
}

function getCategoryLabel(categoryValue) {
  return (
    requestCategories.find((category) => category.value === categoryValue)
      ?.label || "Support request"
  );
}

function formatReceiptDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(date);
}

/*
 * =========================================
 * Contact Page
 * =========================================
 */

function Contact() {
  const { user, isAuthenticated } = useAuth();

  const [form, setForm] = useState(() => createInitialForm(user));

  const [fieldErrors, setFieldErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submissionError, setSubmissionError] = useState("");

  const [requestReceipt, setRequestReceipt] = useState(null);

  /*
   * =========================================
   * Document Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Contact | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Authenticated User Prefill
   * =========================================
   *
   * Do not overwrite anything already typed.
   */

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      name: currentForm.name || getUserName(user),
      email: currentForm.email || getUserEmail(user),
    }));
  }, [isAuthenticated, user]);

  const selectedCategory = useMemo(
    () =>
      requestCategories.find((category) => category.value === form.category) ||
      null,
    [form.category],
  );

  const remainingMessageCharacters =
    MAXIMUM_MESSAGE_LENGTH - form.message.length;

  /*
   * =========================================
   * Input Changes
   * =========================================
   */

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,

      [fieldName]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,

      [fieldName]: undefined,
    }));

    setSubmissionError("");

    /*
     * Starting another request removes the
     * receipt from the previous submission.
     */

    setRequestReceipt(null);
  }

  /*
   * =========================================
   * Preview Submission
   * =========================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmissionError("");
    setRequestReceipt(null);

    const validationErrors = validateContactForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);

      const firstErrorField = [
        "name",
        "email",
        "category",
        "subject",
        "message",
        "replyConsent",
      ].find((fieldName) => validationErrors[fieldName]);

      if (firstErrorField) {
        document.getElementById(`contact-${firstErrorField}`)?.focus();
      }

      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await submitContactRequest(createContactPayload(form));

      if (!result?.request?.id) {
        throw new Error("The server did not return a contact-request receipt.");
      }

      setRequestReceipt({
        id: result.request.id,

        category: result.request.category,

        status: result.request.status,

        createdAt: result.request.createdAt,

        message:
          result.message || "Your support request was submitted successfully.",
      });

      /*
       * Reset the form while preserving any
       * authenticated-user prefill values.
       */

      setForm(createInitialForm(user));
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        setFieldErrors(error.fieldErrors);
      }

      setSubmissionError(
        error?.message ||
          "Your support request could not be submitted. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * =========================================
   * Reset
   * =========================================
   */

  function handleReset() {
    if (isSubmitting) {
      return;
    }

    setForm(createInitialForm(user));

    setFieldErrors({});

    setSubmissionError("");

    setRequestReceipt(null);
  }

  const nameError = getFieldError(fieldErrors, "name");
  const emailError = getFieldError(fieldErrors, "email");
  const categoryError = getFieldError(fieldErrors, "category");
  const subjectError = getFieldError(fieldErrors, "subject");
  const messageError = getFieldError(fieldErrors, "message");
  const replyConsentError = getFieldError(fieldErrors, "replyConsent");

  return (
    <div className="contact-page">
      {/*
       * =====================================
       * Hero
       * =====================================
       */}

      <section className="contact-hero">
        <span className="contact-eyebrow">Contact and support requests</span>

        <h1>Tell us how we can help.</h1>

        <p>
          Select the appropriate request category and provide enough information
          to understand the issue. Never include passwords, verification codes,
          session tokens, or sensitive identification information.
        </p>
      </section>

      {/*
       * =====================================
       * Contact Workspace
       * =====================================
       */}

      <section className="contact-workspace">
        <div className="contact-guidance">
          <div>
            <span className="contact-eyebrow">Before submitting</span>

            <h2>Help us understand the request safely.</h2>

            <p>
              Include what you were trying to do, what happened, and any safe
              troubleshooting steps you already attempted.
            </p>
          </div>

          <div className="contact-guidance-list">
            <article>
              <span aria-hidden="true">01</span>

              <div>
                <h3>Choose the correct category</h3>

                <p>
                  Categorization will help route future requests to the
                  appropriate support workflow.
                </p>
              </div>
            </article>

            <article>
              <span aria-hidden="true">02</span>

              <div>
                <h3>Describe the problem clearly</h3>

                <p>
                  Explain the page, action, result, and any visible error
                  message without including security secrets.
                </p>
              </div>
            </article>

            <article>
              <span aria-hidden="true">03</span>

              <div>
                <h3>Protect sensitive information</h3>

                <p>
                  Support should never require your password, OTP, refresh
                  token, complete cookie, or government identification number.
                </p>
              </div>
            </article>
          </div>

          <Link to="/support" className="contact-support-link">
            Search the support center first
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="contact-form-card">
          <header className="contact-form-header">
            <span>Support request</span>

            <h2>Contact Portfolio Platform</h2>

            <p>Fields marked with an asterisk are required.</p>
          </header>

          {requestReceipt ? (
            <div
              className="contact-submission-success"
              role="status"
              aria-live="polite"
            >
              <span
                className="contact-submission-success-icon"
                aria-hidden="true"
              >
                ✓
              </span>

              <div className="contact-submission-success-content">
                <strong>Request submitted successfully</strong>

                <p>{requestReceipt.message}</p>

                <dl className="contact-receipt">
                  <div>
                    <dt>Request reference</dt>

                    <dd>{requestReceipt.id}</dd>
                  </div>

                  <div>
                    <dt>Category</dt>

                    <dd>{getCategoryLabel(requestReceipt.category)}</dd>
                  </div>

                  <div>
                    <dt>Status</dt>

                    <dd>
                      {requestReceipt.status === "new"
                        ? "New"
                        : requestReceipt.status}
                    </dd>
                  </div>

                  {formatReceiptDate(requestReceipt.createdAt) ? (
                    <div>
                      <dt>Submitted</dt>

                      <dd>{formatReceiptDate(requestReceipt.createdAt)}</dd>
                    </div>
                  ) : null}
                </dl>

                <p className="contact-receipt-guidance">
                  Save the request reference if you need to identify this
                  submission later.
                </p>
              </div>
            </div>
          ) : null}

          {submissionError ? (
            <div className="contact-submission-error" role="alert">
              <span aria-hidden="true">!</span>

              <div>
                <strong>Request could not be submitted</strong>

                <p>{submissionError}</p>
              </div>
            </div>
          ) : null}

          <form
            className="contact-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
          >
            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-name">
                  Name <span aria-hidden="true">*</span>
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={(event) => {
                    updateField("name", event.target.value);
                  }}
                  autoComplete="name"
                  maxLength={MAXIMUM_NAME_LENGTH}
                  placeholder="Your name"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={
                    nameError ? "contact-name-error" : undefined
                  }
                  disabled={isSubmitting}
                />

                {nameError ? (
                  <span id="contact-name-error" className="contact-field-error">
                    {nameError}
                  </span>
                ) : null}
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">
                  Email <span aria-hidden="true">*</span>
                </label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    updateField("email", event.target.value);
                  }}
                  autoComplete="email"
                  inputMode="email"
                  maxLength={MAXIMUM_EMAIL_LENGTH}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? "contact-email-error" : undefined
                  }
                />

                {emailError ? (
                  <span
                    id="contact-email-error"
                    className="contact-field-error"
                  >
                    {emailError}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-category">
                Request category <span aria-hidden="true">*</span>
              </label>

              <select
                id="contact-category"
                name="category"
                value={form.category}
                onChange={(event) => {
                  updateField("category", event.target.value);
                }}
                aria-invalid={Boolean(categoryError)}
                aria-describedby={
                  categoryError
                    ? "contact-category-error"
                    : selectedCategory
                      ? "contact-category-help"
                      : undefined
                }
                disabled={isSubmitting}
              >
                <option value="">Select a request category</option>

                {requestCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {selectedCategory ? (
                <span id="contact-category-help" className="contact-field-help">
                  {selectedCategory.description}
                </span>
              ) : null}

              {categoryError ? (
                <span
                  id="contact-category-error"
                  className="contact-field-error"
                >
                  {categoryError}
                </span>
              ) : null}
            </div>

            <div className="contact-field">
              <label htmlFor="contact-subject">
                Subject <span aria-hidden="true">*</span>
              </label>

              <input
                id="contact-subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={(event) => {
                  updateField("subject", event.target.value);
                }}
                maxLength={MAXIMUM_SUBJECT_LENGTH}
                placeholder="Briefly describe your request"
                aria-invalid={Boolean(subjectError)}
                aria-describedby={
                  subjectError ? "contact-subject-error" : undefined
                }
              />

              {subjectError ? (
                <span
                  id="contact-subject-error"
                  className="contact-field-error"
                >
                  {subjectError}
                </span>
              ) : null}
            </div>

            <div className="contact-field">
              <div className="contact-label-row">
                <label htmlFor="contact-message">
                  Message <span aria-hidden="true">*</span>
                </label>

                <span
                  className={
                    remainingMessageCharacters < 250
                      ? "contact-character-count contact-character-count--warning"
                      : "contact-character-count"
                  }
                >
                  {remainingMessageCharacters} characters remaining
                </span>
              </div>

              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={(event) => {
                  updateField("message", event.target.value);
                }}
                rows="8"
                maxLength={MAXIMUM_MESSAGE_LENGTH}
                placeholder="Explain what you were trying to do, what happened, and any safe troubleshooting steps you attempted."
                aria-invalid={Boolean(messageError)}
                aria-describedby={
                  messageError
                    ? "contact-message-error"
                    : "contact-message-help"
                }
                disabled={isSubmitting}
              />

              <span id="contact-message-help" className="contact-field-help">
                Do not enter passwords, verification codes, session tokens,
                financial details, or identification numbers.
              </span>

              {messageError ? (
                <span
                  id="contact-message-error"
                  className="contact-field-error"
                >
                  {messageError}
                </span>
              ) : null}
            </div>

            <div className="contact-consent-field">
              <input
                id="contact-replyConsent"
                name="replyConsent"
                type="checkbox"
                checked={form.replyConsent}
                onChange={(event) => {
                  updateField("replyConsent", event.target.checked);
                }}
                aria-invalid={Boolean(replyConsentError)}
                aria-describedby={
                  replyConsentError ? "contact-reply-consent-error" : undefined
                }
              />

              <label htmlFor="contact-replyConsent">
                I understand that my name, email address, and request
                information may be used to review and respond to this request.
              </label>
            </div>

            {replyConsentError ? (
              <span
                id="contact-reply-consent-error"
                className="contact-field-error contact-consent-error"
              >
                {replyConsentError}
              </span>
            ) : null}

            <div className="contact-form-actions">
              <button
                type="submit"
                className="contact-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="contact-submit-spinner"
                      aria-hidden="true"
                    />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    Submit Request
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="contact-reset-button"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset Form
              </button>
            </div>

            <p className="contact-submit-explanation">
              Your request will be stored securely for review. Do not include
              passwords, OTPs, session tokens, or other security secrets.
            </p>

            <p className="contact-submit-explanation">
              Validation does not currently send or save the request.
            </p>
          </form>
        </div>
      </section>
      <div className="contact-service-notice">
        <span aria-hidden="true">✓</span>

        <div>
          <strong>Secure contact submission is available</strong>

          <p>
            Submitted requests are validated by the API and stored securely for
            review. You will receive a request reference after a successful
            submission.
          </p>
        </div>
      </div>
      <p></p>

      {/*
       * =====================================
       * Direct Contact Information
       * =====================================
       */}

      <section
        className="contact-direct"
        aria-labelledby="contact-direct-title"
      >
        <div className="contact-direct-introduction">
          <span className="contact-eyebrow">Direct contact</span>

          <h2 id="contact-direct-title">Prefer to contact us directly?</h2>

          <p>
            Until secure form submission is available, you can contact Portfolio
            Platform directly by email or phone.
          </p>
        </div>

        <div className="contact-direct-options">
          <article className="contact-direct-card">
            <span className="contact-direct-icon" aria-hidden="true">
              @
            </span>

            <div>
              <span className="contact-direct-label">Email</span>

              <a
                href={`mailto:${PUBLIC_CONTACT_EMAIL}`}
                className="contact-direct-value"
              >
                {PUBLIC_CONTACT_EMAIL}
              </a>

              <p>
                Use email for general support, partnerships, feedback, and
                nonurgent technical questions.
              </p>
            </div>
          </article>

          <article className="contact-direct-card">
            <span className="contact-direct-icon" aria-hidden="true">
              ☎
            </span>

            <div>
              <span className="contact-direct-label">Phone</span>

              <a
                href={`tel:${PUBLIC_CONTACT_PHONE_LINK}`}
                className="contact-direct-value"
              >
                {PUBLIC_CONTACT_PHONE_DISPLAY}
              </a>

              <p>
                Phone availability may be limited. Email is recommended for
                requests requiring technical details.
              </p>
            </div>
          </article>

          <article className="contact-direct-card">
            <span className="contact-direct-icon" aria-hidden="true">
              ◷
            </span>

            <div>
              <span className="contact-direct-label">Availability</span>

              <strong className="contact-direct-value">
                1–2 business days
              </strong>

              <p>{PUBLIC_CONTACT_AVAILABILITY}</p>
            </div>
          </article>
        </div>

        <div className="contact-direct-safety" role="note">
          <span aria-hidden="true">!</span>

          <p>
            Never send your password, one-time verification code, session
            cookie, financial information, or identification number by email,
            phone, or through the support form.
          </p>
        </div>
      </section>

      {/*
       * =====================================
       * Request Routing
       * =====================================
       */}

      <section className="contact-routing">
        <div className="contact-routing-heading">
          <span className="contact-eyebrow">Future request handling</span>

          <h2>A structure prepared for secure support workflows.</h2>

          <p>
            When backend submission is implemented, categories can route
            requests appropriately without exposing internal application
            details.
          </p>
        </div>

        <div className="contact-routing-grid">
          <article>
            <span aria-hidden="true">◇</span>

            <h3>Account and technical support</h3>

            <p>
              Login, verification, session, profile, resume, portfolio, and
              application problems.
            </p>
          </article>

          <article>
            <span aria-hidden="true">🔒</span>

            <h3>Privacy and security review</h3>

            <p>
              Privacy requests, suspicious activity, data questions, and
              responsible security reports.
            </p>
          </article>

          <article>
            <span aria-hidden="true">◎</span>

            <h3>Partnerships and feedback</h3>

            <p>
              Organizational inquiries, collaboration, accessibility feedback,
              and product suggestions.
            </p>
          </article>
        </div>
      </section>

      <p className="contact-final-warning">
        Portfolio Platform support should never ask for your password, one-time
        verification code, or complete authentication cookie.
      </p>
    </div>
  );
}

export default Contact;
