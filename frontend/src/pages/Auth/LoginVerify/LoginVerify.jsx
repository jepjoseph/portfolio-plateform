import { createRef, useEffect, useRef, useState } from "react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { AUTH_OPERATION, useAuth } from "../../../context/AuthContext.jsx";

import { resendLoginOtp } from "../../../services/Auth/authService.js";

import "./LoginVerify.css";

/*
 * =========================================
 * OTP Configuration
 * =========================================
 */

const OTP_LENGTH = 6;

const OTP_PATTERN = /^\d{6}$/;

const DEFAULT_OTP_LIFETIME_MS = 10 * 60 * 1000;

const DEFAULT_RESEND_COOLDOWN_MS = 60 * 1000;

/*
 * =========================================
 * Expiration Helpers
 * =========================================
 */

function getExpirationTime(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatRemainingTime(remainingMilliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000));

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/*
 * =========================================
 * Login Verification Page
 * =========================================
 */

function LoginVerify() {
  const location = useLocation();

  const navigate = useNavigate();

  const { completeLogin, operation, clearError } = useAuth();

  /*
   * =========================================
   * Navigation State
   * =========================================
   */

  const challengeId =
    typeof location.state?.challengeId === "string"
      ? location.state.challengeId.trim()
      : "";

  const maskedEmail =
    typeof location.state?.email === "string" && location.state.email.trim()
      ? location.state.email.trim()
      : "your verified email address";

  /*
   * =========================================
   * Component State
   * =========================================
   */

  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(""));

  const [fieldError, setFieldError] = useState("");

  const [submissionError, setSubmissionError] = useState("");

  const [resendMessage, setResendMessage] = useState("");

  const [isResending, setIsResending] = useState(false);

  /*
   * currentTime must be declared before any
   * calculation that uses it.
   */

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [expirationTime, setExpirationTime] = useState(() => {
    return (
      getExpirationTime(location.state?.expiresAt) ||
      Date.now() + DEFAULT_OTP_LIFETIME_MS
    );
  });

  const [resendAvailableAt, setResendAvailableAt] = useState(() => {
    return (
      getExpirationTime(location.state?.resendAvailableAt) ||
      Date.now() + DEFAULT_RESEND_COOLDOWN_MS
    );
  });

  const [maximumAttempts, setMaximumAttempts] = useState(() => {
    const attempts = Number(location.state?.maximumAttempts);

    return Number.isInteger(attempts) && attempts > 0 ? attempts : 5;
  });

  const inputRefs = useRef(
    Array.from(
      {
        length: OTP_LENGTH,
      },
      () => createRef(),
    ),
  );

  /*
   * =========================================
   * Derived State
   * =========================================
   */

  const isSubmitting = operation === AUTH_OPERATION.VERIFYING_LOGIN;

  const remainingMilliseconds = expirationTime
    ? expirationTime - currentTime
    : 0;

  const isExpired = remainingMilliseconds <= 0;

  const resendRemainingMilliseconds = resendAvailableAt
    ? resendAvailableAt - currentTime
    : 0;

  const resendRemainingSeconds = Math.max(
    0,
    Math.ceil(resendRemainingMilliseconds / 1000),
  );

  const canResend =
    Boolean(challengeId) &&
    resendRemainingSeconds === 0 &&
    !isResending &&
    !isSubmitting;

  const verificationCode = digits.join("");

  /*
   * =========================================
   * Page Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Verify Sign In | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Countdown Timer
   * =========================================
   *
   * This timer updates both:
   *
   * 1. OTP expiration countdown
   * 2. Resend cooldown countdown
   */

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  /*
   * =========================================
   * Focus First Digit
   * =========================================
   */

  useEffect(() => {
    if (challengeId) {
      inputRefs.current[0]?.current?.focus();
    }
  }, [challengeId]);

  /*
   * =========================================
   * Digit Change
   * =========================================
   */

  function handleDigitChange(index, value) {
    const numericValue = String(value).replace(/\D/g, "").slice(-1);

    setDigits((currentDigits) => {
      const nextDigits = [...currentDigits];

      nextDigits[index] = numericValue;

      return nextDigits;
    });

    setFieldError("");

    setSubmissionError("");

    setResendMessage("");

    if (numericValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.current?.focus();
    }
  }

  /*
   * =========================================
   * Keyboard Navigation
   * =========================================
   */

  function handleDigitKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();

      inputRefs.current[index - 1]?.current?.focus();

      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();

      inputRefs.current[index + 1]?.current?.focus();
    }
  }

  /*
   * =========================================
   * Paste Complete OTP
   * =========================================
   */

  function handlePaste(event) {
    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedValue) {
      return;
    }

    event.preventDefault();

    const nextDigits = Array(OTP_LENGTH).fill("");

    for (let index = 0; index < pastedValue.length; index += 1) {
      nextDigits[index] = pastedValue[index];
    }

    setDigits(nextDigits);

    setFieldError("");

    setSubmissionError("");

    setResendMessage("");

    const focusIndex = Math.min(pastedValue.length, OTP_LENGTH) - 1;

    inputRefs.current[Math.max(focusIndex, 0)]?.current?.focus();
  }

  /*
   * =========================================
   * Resend Login OTP
   * =========================================
   */

  async function handleResendCode() {
    if (!canResend) {
      return;
    }

    clearError();

    setIsResending(true);

    setSubmissionError("");

    setFieldError("");

    setResendMessage("");

    try {
      const result = await resendLoginOtp({
        challengeId,
      });

      const now = Date.now();

      const nextExpirationTime = getExpirationTime(result?.expiresAt);

      const nextResendAvailableTime = getExpirationTime(
        result?.resendAvailableAt,
      );

      setExpirationTime(nextExpirationTime || now + DEFAULT_OTP_LIFETIME_MS);

      setResendAvailableAt(
        nextResendAvailableTime || now + DEFAULT_RESEND_COOLDOWN_MS,
      );

      const nextMaximumAttempts = Number(result?.maximumAttempts);

      if (Number.isInteger(nextMaximumAttempts) && nextMaximumAttempts > 0) {
        setMaximumAttempts(nextMaximumAttempts);
      }

      /*
       * The previous OTP is no longer valid.
       * Remove any digits already entered.
       */

      setDigits(Array(OTP_LENGTH).fill(""));

      setCurrentTime(now);

      setResendMessage(
        result?.message || "A new verification code was sent to your email.",
      );

      window.setTimeout(() => {
        inputRefs.current[0]?.current?.focus();
      }, 0);
    } catch (error) {
      /*
       * The backend can return a retry delay
       * when the resend cooldown is active.
       */

      const retryAfterSeconds = Number(error?.details?.retryAfterSeconds);

      const retryAt = getExpirationTime(error?.details?.resendAvailableAt);

      if (retryAt) {
        setResendAvailableAt(retryAt);
      } else if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        setResendAvailableAt(Date.now() + retryAfterSeconds * 1000);
      }

      setCurrentTime(Date.now());

      setSubmissionError(
        error?.message ||
          "A new verification code could not be sent. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  }

  /*
   * =========================================
   * Verify Login OTP
   * =========================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || isResending || isExpired) {
      return;
    }

    clearError();

    setFieldError("");

    setSubmissionError("");

    setResendMessage("");

    if (!OTP_PATTERN.test(verificationCode)) {
      setFieldError("Enter the complete six-digit verification code.");

      const firstEmptyIndex = digits.findIndex((digit) => !digit);

      inputRefs.current[
        firstEmptyIndex >= 0 ? firstEmptyIndex : 0
      ]?.current?.focus();

      return;
    }

    try {
      await completeLogin({
        challengeId,

        otp: verificationCode,
      });

      /*
       * Every successful new login starts
       * on the main dashboard.
       */

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      const otpErrors = error?.fieldErrors?.otp;

      if (Array.isArray(otpErrors) && otpErrors[0]) {
        setFieldError(otpErrors[0]);
      }

      setSubmissionError(
        error?.message || "The verification code could not be confirmed.",
      );

      setDigits(Array(OTP_LENGTH).fill(""));

      window.setTimeout(() => {
        inputRefs.current[0]?.current?.focus();
      }, 0);
    }
  }

  /*
   * =========================================
   * Missing Login Challenge
   * =========================================
   *
   * The challenge exists only in navigation
   * state. Reloading this page returns the
   * visitor to the login page.
   */

  if (!challengeId) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{
          message: "Start by entering your email and password.",
        }}
      />
    );
  }

  /*
   * =========================================
   * Page
   * =========================================
   */

  return (
    <section className="login-verify-page" aria-labelledby="login-verify-title">
      <header className="login-verify-header">
        <span className="login-verify-eyebrow">Two-step verification</span>

        <h2 id="login-verify-title">Check your email</h2>

        <p>
          Enter the six-digit code sent to <strong>{maskedEmail}</strong>.
        </p>
      </header>

      <div className="login-verify-summary">
        <div>
          <span>Code expires in</span>

          <strong className={isExpired ? "login-verify-expired" : ""}>
            {formatRemainingTime(remainingMilliseconds)}
          </strong>
        </div>

        <div>
          <span>Maximum attempts</span>

          <strong>{maximumAttempts}</strong>
        </div>
      </div>

      {isExpired ? (
        <div className="login-verify-alert" role="alert">
          <span aria-hidden="true">!</span>

          <div>
            <strong>This code has expired</strong>

            <p>
              Request a new verification code below or return to the sign-in
              page.
            </p>
          </div>
        </div>
      ) : null}

      {submissionError ? (
        <div className="login-verify-alert" role="alert">
          <span aria-hidden="true">!</span>

          <div>
            <strong>Request unsuccessful</strong>

            <p>{submissionError}</p>
          </div>
        </div>
      ) : null}

      {resendMessage ? (
        <div className="login-verify-success" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>

          <div>
            <strong>New code sent</strong>

            <p>{resendMessage}</p>
          </div>
        </div>
      ) : null}

      <form className="login-verify-form" onSubmit={handleSubmit} noValidate>
        <fieldset
          className="login-verify-code-fieldset"
          disabled={isSubmitting || isResending || isExpired}
        >
          <legend>Verification code</legend>

          <div
            className={`login-verify-code-inputs ${
              fieldError ? "login-verify-code-inputs--error" : ""
            }`}
            onPaste={handlePaste}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs.current[index]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => {
                  handleDigitChange(index, event.target.value);
                }}
                onKeyDown={(event) => {
                  handleDigitKeyDown(index, event);
                }}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Verification code digit ${
                  index + 1
                } of ${OTP_LENGTH}`}
                aria-invalid={Boolean(fieldError)}
              />
            ))}
          </div>

          {fieldError ? (
            <span className="login-verify-field-error" role="alert">
              {fieldError}
            </span>
          ) : null}
        </fieldset>

        <button
          type="submit"
          className="login-verify-submit"
          disabled={isSubmitting || isResending || isExpired}
        >
          {isSubmitting ? (
            <>
              <span className="login-verify-spinner" aria-hidden="true" />
              Confirming code...
            </>
          ) : (
            <>
              Verify and sign in
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <div className="login-verify-help">
        <p>Did not receive the code?</p>

        <button
          type="button"
          className="login-verify-resend"
          onClick={() => {
            void handleResendCode();
          }}
          disabled={!canResend}
        >
          {isResending
            ? "Sending..."
            : resendRemainingSeconds > 0
              ? `Resend in ${resendRemainingSeconds}s`
              : "Resend Code"}
        </button>

        <Link to="/auth/login" replace>
          Return to sign in
        </Link>
      </div>
    </section>
  );
}

export default LoginVerify;
