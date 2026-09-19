import { useEffect, useState } from "react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { AUTH_OPERATION, useAuth } from "../../../context/AuthContext.jsx";

import "./SetPassword.css";

/*
 * =========================================
 * Password Configuration
 * =========================================
 */

const MINIMUM_PASSWORD_LENGTH = 12;

const MAXIMUM_PASSWORD_LENGTH = 256;

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
 * Password Validation
 * =========================================
 */

function validatePasswords({ password, passwordConfirmation }) {
  const errors = {};

  if (!password) {
    errors.password = ["Create a password."];
  } else if (password.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = [
      `Password must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
    ];
  } else if (password.length > MAXIMUM_PASSWORD_LENGTH) {
    errors.password = [
      `Password cannot contain more than ${MAXIMUM_PASSWORD_LENGTH} characters.`,
    ];
  }

  if (!passwordConfirmation) {
    errors.passwordConfirmation = ["Confirm your password."];
  } else if (passwordConfirmation !== password) {
    errors.passwordConfirmation = ["Passwords do not match."];
  }

  return errors;
}

/*
 * =========================================
 * Set Password Page
 * =========================================
 */

function SetPassword() {
  const location = useLocation();

  const navigate = useNavigate();

  const { finishRegistration, operation, clearError } = useAuth();

  const challengeId =
    typeof location.state?.challengeId === "string"
      ? location.state.challengeId.trim()
      : "";

  const continuationToken =
    typeof location.state?.continuationToken === "string"
      ? location.state.continuationToken.trim()
      : "";

  const maskedEmail =
    typeof location.state?.email === "string" ? location.state.email : "";

  const accountEmail =
    typeof location.state?.accountEmail === "string"
      ? location.state.accountEmail.trim().toLowerCase()
      : "";

  const [password, setPassword] = useState("");

  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const [submissionError, setSubmissionError] = useState("");

  const isSubmitting = operation === AUTH_OPERATION.COMPLETING_REGISTRATION;

  /*
   * =========================================
   * Page Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Create Password | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Input Changes
   * =========================================
   */

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    setFieldErrors((currentErrors) => ({
      ...currentErrors,

      password: undefined,

      passwordConfirmation: undefined,
    }));

    setSubmissionError("");
  }

  function handleConfirmationChange(event) {
    setPasswordConfirmation(event.target.value);

    setFieldErrors((currentErrors) => ({
      ...currentErrors,

      passwordConfirmation: undefined,
    }));

    setSubmissionError("");
  }

  /*
   * =========================================
   * Submit
   * =========================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearError();

    setSubmissionError("");

    const validationErrors = validatePasswords({
      password,

      passwordConfirmation,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);

      return;
    }

    setFieldErrors({});

    try {
      const result = await finishRegistration({
        challengeId,

        continuationToken,

        password,
      });

      navigate("/auth/login", {
        replace: true,

        state: {
          email: accountEmail || result?.user?.email || "",

          message:
            result?.message ||
            "Your account was created successfully. Sign in to continue.",
        },
      });
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        setFieldErrors(error.fieldErrors);
      }

      setSubmissionError(
        error?.message ||
          "Your account could not be created. Please try again.",
      );
    }
  }

  /*
   * A verified challenge and continuation
   * token must exist in navigation state.
   */

  if (!challengeId || !continuationToken) {
    return (
      <Navigate
        to="/auth/register"
        replace
        state={{
          message: "Start registration with your email address.",
        }}
      />
    );
  }

  const passwordError = getFirstFieldError(fieldErrors, "password");

  const confirmationError = getFirstFieldError(
    fieldErrors,
    "passwordConfirmation",
  );

  return (
    <section className="set-password-page" aria-labelledby="set-password-title">
      <header className="set-password-header">
        <span className="set-password-eyebrow">Secure your account</span>

        <h2 id="set-password-title">Create your password</h2>

        <p>
          Create a strong password for{" "}
          {maskedEmail ? (
            <strong>{maskedEmail}</strong>
          ) : (
            "your verified email address"
          )}
          .
        </p>
      </header>

      {submissionError ? (
        <div className="set-password-alert" role="alert">
          <span aria-hidden="true">!</span>

          <p>{submissionError}</p>
        </div>
      ) : null}

      <form className="set-password-form" onSubmit={handleSubmit} noValidate>
        <div className="set-password-field">
          <label htmlFor="new-password">Password</label>

          <div
            className={[
              "set-password-input-shell",
              passwordError ? "set-password-input-shell--error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="set-password-input-icon" aria-hidden="true">
              ●
            </span>

            <input
              id="new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              maxLength={MAXIMUM_PASSWORD_LENGTH}
              placeholder="Create a secure password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError ? "new-password-error" : "password-requirements"
              }
              disabled={isSubmitting}
              autoFocus
            />

            <button
              type="button"
              className="set-password-toggle"
              onClick={() => {
                setShowPassword((currentValue) => !currentValue);
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isSubmitting}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {passwordError ? (
            <span id="new-password-error" className="set-password-field-error">
              {passwordError}
            </span>
          ) : null}
        </div>

        <div className="set-password-field">
          <label htmlFor="confirm-password">Confirm password</label>

          <div
            className={[
              "set-password-input-shell",
              confirmationError ? "set-password-input-shell--error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="set-password-input-icon" aria-hidden="true">
              ●
            </span>

            <input
              id="confirm-password"
              name="passwordConfirmation"
              type={showPasswordConfirmation ? "text" : "password"}
              value={passwordConfirmation}
              onChange={handleConfirmationChange}
              autoComplete="new-password"
              maxLength={MAXIMUM_PASSWORD_LENGTH}
              placeholder="Enter the password again"
              aria-invalid={Boolean(confirmationError)}
              aria-describedby={
                confirmationError ? "confirm-password-error" : undefined
              }
              disabled={isSubmitting}
            />

            <button
              type="button"
              className="set-password-toggle"
              onClick={() => {
                setShowPasswordConfirmation((currentValue) => !currentValue);
              }}
              aria-label={
                showPasswordConfirmation
                  ? "Hide password confirmation"
                  : "Show password confirmation"
              }
              aria-pressed={showPasswordConfirmation}
              disabled={isSubmitting}
            >
              {showPasswordConfirmation ? "Hide" : "Show"}
            </button>
          </div>

          {confirmationError ? (
            <span
              id="confirm-password-error"
              className="set-password-field-error"
            >
              {confirmationError}
            </span>
          ) : null}
        </div>

        <div
          id="password-requirements"
          className="set-password-requirements"
          role="note"
        >
          <strong>Password requirements</strong>

          <ul>
            <li>At least {MINIMUM_PASSWORD_LENGTH} characters</li>

            <li>Up to {MAXIMUM_PASSWORD_LENGTH} characters</li>

            <li>Long passphrases and password managers are supported</li>
          </ul>
        </div>

        <button
          type="submit"
          className="set-password-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="set-password-spinner" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <div className="set-password-help">
        <p>Need to start again?</p>

        <Link to="/auth/register" replace>
          Return to registration
        </Link>
      </div>
    </section>
  );
}

export default SetPassword;
