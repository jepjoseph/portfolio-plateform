import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { AUTH_OPERATION, useAuth } from "../../../context/AuthContext.jsx";

import "./Register.css";

/*
 * =========================================
 * Email Validation
 * =========================================
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAXIMUM_EMAIL_LENGTH = 320;

/*
 * =========================================
 * Field Error Helper
 * =========================================
 */

function getFirstFieldError(fieldErrors, fieldName) {
  const errors = fieldErrors?.[fieldName];

  return Array.isArray(errors) ? errors[0] || "" : "";
}

/*
 * =========================================
 * Registration Page
 * =========================================
 */

function Register() {
  const navigate = useNavigate();

  const { beginRegistration, operation, clearError } = useAuth();

  const [email, setEmail] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [submissionError, setSubmissionError] = useState("");

  const isSubmitting = operation === AUTH_OPERATION.REQUESTING_REGISTRATION;

  /*
   * =========================================
   * Page Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Create Account | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Email Change
   * =========================================
   */

  function handleEmailChange(event) {
    setEmail(event.target.value);

    setFieldErrors((currentErrors) => ({
      ...currentErrors,

      email: undefined,
    }));

    setSubmissionError("");
  }

  /*
   * =========================================
   * Validation
   * =========================================
   */

  function validateRegistrationEmail() {
    const errors = {};

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      errors.email = ["Enter your email address."];
    } else if (normalizedEmail.length > MAXIMUM_EMAIL_LENGTH) {
      errors.email = ["Email address is too long."];
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      errors.email = ["Enter a valid email address."];
    }

    return errors;
  }

  /*
   * =========================================
   * Submit Registration Request
   * =========================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearError();

    setSubmissionError("");

    const validationErrors = validateRegistrationEmail();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);

      return;
    }

    setFieldErrors({});

    try {
      const result = await beginRegistration({
        email,
      });

      if (!result?.challengeId) {
        throw new Error(
          "The server did not return a registration verification challenge.",
        );
      }

      navigate("/auth/register/verify", {
        state: {
          challengeId: result.challengeId,

          email: result.email,

          accountEmail: email.trim().toLowerCase(),

          expiresAt: result.expiresAt,

          maximumAttempts: result.maximumAttempts,
        },
      });
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        setFieldErrors(error.fieldErrors);
      }

      setSubmissionError(
        error?.message ||
          "Registration could not be started. Please try again.",
      );
    }
  }

  const emailError = getFirstFieldError(fieldErrors, "email");

  return (
    <section className="register-page" aria-labelledby="register-title">
      <header className="register-page-header">
        <span className="register-page-eyebrow">Create your account</span>

        <h2 id="register-title">Start with your email</h2>

        <p>
          Enter the email address you want to use for your account. We will send
          you a six-digit verification code.
        </p>
      </header>

      {submissionError ? (
        <div className="register-page-alert" role="alert">
          <span aria-hidden="true">!</span>

          <p>{submissionError}</p>
        </div>
      ) : null}

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <div className="register-field">
          <label htmlFor="register-email">Email address</label>

          <div
            className={[
              "register-input-shell",
              emailError ? "register-input-shell--error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="register-input-icon" aria-hidden="true">
              @
            </span>

            <input
              id="register-email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              inputMode="email"
              maxLength={MAXIMUM_EMAIL_LENGTH}
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "register-email-error" : undefined}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {emailError ? (
            <span id="register-email-error" className="register-field-error">
              {emailError}
            </span>
          ) : null}
        </div>

        <div className="register-email-information" role="note">
          <span aria-hidden="true">✓</span>

          <p>
            Use an email address you can access. You will need the verification
            code before creating your password.
          </p>
        </div>

        <button
          type="submit"
          className="register-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="register-button-spinner" aria-hidden="true" />
              Sending verification code...
            </>
          ) : (
            <>
              Continue with email
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <div className="register-page-divider">
        <span />

        <p>Already have an account?</p>

        <span />
      </div>

      <Link to="/auth/login" className="register-sign-in-link">
        Sign in instead
      </Link>
    </section>
  );
}

export default Register;
