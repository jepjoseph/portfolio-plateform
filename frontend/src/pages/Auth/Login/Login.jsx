import { useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { AUTH_OPERATION, useAuth } from "../../../context/AuthContext.jsx";

import "./Login.css";

/*
 * =========================================
 * Email Validation
 * =========================================
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAXIMUM_EMAIL_LENGTH = 320;

const MAXIMUM_PASSWORD_LENGTH = 256;

/*
 * =========================================
 * Safe Return Destination
 * =========================================
 */

function getSafeReturnTo(value) {
  if (typeof value !== "string") {
    return "";
  }

  const destination = value.trim();

  if (
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    destination.includes("://") ||
    destination.startsWith("/auth")
  ) {
    return "";
  }

  return destination;
}

/*
 * =========================================
 * Login Validation
 * =========================================
 */

function validateLogin({ email, password }) {
  const fieldErrors = {};

  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    fieldErrors.email = ["Enter your email address."];
  } else if (normalizedEmail.length > MAXIMUM_EMAIL_LENGTH) {
    fieldErrors.email = ["Email address is too long."];
  } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
    fieldErrors.email = ["Enter a valid email address."];
  }

  if (!password) {
    fieldErrors.password = ["Enter your password."];
  } else if (password.length > MAXIMUM_PASSWORD_LENGTH) {
    fieldErrors.password = [
      `Password cannot contain more than ${MAXIMUM_PASSWORD_LENGTH} characters.`,
    ];
  }

  return fieldErrors;
}

/*
 * =========================================
 * First Field Error
 * =========================================
 */

function getFirstFieldError(fieldErrors, fieldName) {
  const errors = fieldErrors?.[fieldName];

  return Array.isArray(errors) ? errors[0] || "" : "";
}

/*
 * =========================================
 * Login Page
 * =========================================
 */

function Login() {
  const navigate = useNavigate();

  const location = useLocation();

  const { beginPasswordLogin, operation, clearError } = useAuth();

  const [email, setEmail] = useState(() =>
    typeof location.state?.email === "string" ? location.state.email : "",
  );

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const [submissionError, setSubmissionError] = useState("");

  const isSubmitting = operation === AUTH_OPERATION.REQUESTING_LOGIN;

  const returnTo = useMemo(
    () => getSafeReturnTo(location.state?.returnTo),
    [location.state],
  );

  /*
   * =========================================
   * Page Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Sign In | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Input Changes
   * =========================================
   */

  const handleEmailChange = (event) => {
    setEmail(event.target.value);

    setFieldErrors((currentErrors) => ({
      ...currentErrors,

      email: undefined,
    }));

    setSubmissionError("");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);

    setFieldErrors((currentErrors) => ({
      ...currentErrors,

      password: undefined,
    }));

    setSubmissionError("");
  };

  /*
   * =========================================
   * Submit
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearError();

    setSubmissionError("");

    const validationErrors = validateLogin({
      email,

      password,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);

      return;
    }

    setFieldErrors({});

    try {
      const result = await beginPasswordLogin({
        email,

        password,
      });

      if (!result?.challengeId) {
        throw new Error(
          "The server did not return a login verification challenge.",
        );
      }

      navigate("/auth/login/verify", {
        replace: false,

        state: {
          challengeId: result.challengeId,

          email: result.email,

          expiresAt: result.expiresAt,

          maximumAttempts: result.maximumAttempts,

          returnTo: returnTo || "/dashboard",
        },
      });
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        setFieldErrors(error.fieldErrors);
      }

      setSubmissionError(
        error?.message || "Unable to sign in. Please try again.",
      );
    }
  };

  const emailError = getFirstFieldError(fieldErrors, "email");

  const passwordError = getFirstFieldError(fieldErrors, "password");

  return (
    <section className="login-page" aria-labelledby="login-title">
      <header className="login-page-header">
        {location.state?.message ? (
          <div className="login-page-success" role="status">
            <span aria-hidden="true">✓</span>

            <p>{location.state.message}</p>
          </div>
        ) : null}
        <span className="login-page-eyebrow">Welcome back</span>

        <h2 id="login-title">Sign in to your account</h2>

        <p>
          Enter your email and password. We will then send a one-time code to
          your verified email address.
        </p>
      </header>

      {submissionError ? (
        <div className="login-page-alert" role="alert">
          <span aria-hidden="true">!</span>

          <p>{submissionError}</p>
        </div>
      ) : null}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="login-field">
          <label htmlFor="login-email">Email address</label>

          <div
            className={`login-input-shell ${
              emailError ? "login-input-shell--error" : ""
            }`}
          >
            <span className="login-input-icon" aria-hidden="true">
              @
            </span>

            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              inputMode="email"
              maxLength={MAXIMUM_EMAIL_LENGTH}
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "login-email-error" : undefined}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {emailError ? (
            <span id="login-email-error" className="login-field-error">
              {emailError}
            </span>
          ) : null}
        </div>

        <div className="login-field">
          <div className="login-label-row">
            <label htmlFor="login-password">Password</label>

            <Link
              to="/auth/forgot-password"
              tabIndex={isSubmitting ? -1 : undefined}
            >
              Forgot password?
            </Link>
          </div>

          <div
            className={`login-input-shell ${
              passwordError ? "login-input-shell--error" : ""
            }`}
          >
            <span className="login-input-icon" aria-hidden="true">
              ●
            </span>

            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              maxLength={MAXIMUM_PASSWORD_LENGTH}
              placeholder="Enter your password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError ? "login-password-error" : undefined
              }
              disabled={isSubmitting}
            />

            <button
              type="button"
              className="login-password-toggle"
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
            <span id="login-password-error" className="login-field-error">
              {passwordError}
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          className="login-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="login-button-spinner" aria-hidden="true" />
              Verifying password...
            </>
          ) : (
            <>
              Continue securely
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <div className="login-page-divider">
        <span />
        <p>New to the platform?</p>
        <span />
      </div>

      <Link to="/auth/register" className="login-create-account">
        Create an account
      </Link>
    </section>
  );
}

export default Login;
