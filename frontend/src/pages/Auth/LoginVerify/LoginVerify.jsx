import { createRef, useEffect, useMemo, useRef, useState } from "react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { AUTH_OPERATION, useAuth } from "../../../context/AuthContext.jsx";

import "./LoginVerify.css";

/*
 * =========================================
 * OTP Configuration
 * =========================================
 */

const OTP_LENGTH = 6;

const OTP_PATTERN = /^\d{6}$/;

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

  const challengeId =
    typeof location.state?.challengeId === "string"
      ? location.state.challengeId.trim()
      : "";

  const maskedEmail =
    typeof location.state?.email === "string"
      ? location.state.email
      : "your verified email address";

  const expirationTime = useMemo(
    () => getExpirationTime(location.state?.expiresAt),
    [location.state?.expiresAt],
  );

  const maximumAttempts = Number(location.state?.maximumAttempts) || 5;

  const returnTo = useMemo(
    () => getSafeReturnTo(location.state?.returnTo) || "/dashboard",
    [location.state?.returnTo],
  );

  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(""));

  const [fieldError, setFieldError] = useState("");

  const [submissionError, setSubmissionError] = useState("");

  const [currentTime, setCurrentTime] = useState(Date.now());

  const inputRefs = useRef(
    Array.from(
      {
        length: OTP_LENGTH,
      },
      () => createRef(),
    ),
  );

  const isSubmitting = operation === AUTH_OPERATION.VERIFYING_LOGIN;

  const remainingMilliseconds = expirationTime
    ? expirationTime - currentTime
    : null;

  const isExpired =
    remainingMilliseconds !== null && remainingMilliseconds <= 0;

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
   * Countdown
   * =========================================
   */

  useEffect(() => {
    if (!expirationTime || isExpired) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expirationTime, isExpired]);

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

  const handleDigitChange = (index, value) => {
    const numericValue = String(value).replace(/\D/g, "").slice(-1);

    setDigits((currentDigits) => {
      const nextDigits = [...currentDigits];

      nextDigits[index] = numericValue;

      return nextDigits;
    });

    setFieldError("");

    setSubmissionError("");

    if (numericValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.current?.focus();
    }
  };

  /*
   * =========================================
   * Keyboard Navigation
   * =========================================
   */

  const handleDigitKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();

      inputRefs.current[index - 1]?.current?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();

      inputRefs.current[index + 1]?.current?.focus();
    }
  };

  /*
   * =========================================
   * Paste Complete OTP
   * =========================================
   */

  const handlePaste = (event) => {
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

    const focusIndex = Math.min(pastedValue.length, OTP_LENGTH) - 1;

    inputRefs.current[Math.max(focusIndex, 0)]?.current?.focus();
  };

  /*
   * =========================================
   * Submit
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || isExpired) {
      return;
    }

    clearError();

    setFieldError("");

    setSubmissionError("");

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

      navigate(returnTo, {
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
  };

  /*
   * A challenge exists only in navigation
   * state. Reloading or directly opening this
   * route returns the visitor to login.
   */

  if (!challengeId) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{
          returnTo,
          message: "Start by entering your email and password.",
        }}
      />
    );
  }

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
            {expirationTime
              ? formatRemainingTime(remainingMilliseconds)
              : "10:00"}
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

            <p>Return to sign in to request a new verification code.</p>
          </div>
        </div>
      ) : null}

      {submissionError && !isExpired ? (
        <div className="login-verify-alert" role="alert">
          <span aria-hidden="true">!</span>

          <div>
            <strong>Verification unsuccessful</strong>

            <p>{submissionError}</p>
          </div>
        </div>
      ) : null}

      <form className="login-verify-form" onSubmit={handleSubmit} noValidate>
        <fieldset
          className="login-verify-code-fieldset"
          disabled={isSubmitting || isExpired}
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
                maxLength="1"
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
          disabled={isSubmitting || isExpired}
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

        <Link
          to="/auth/login"
          replace
          state={{
            returnTo,
          }}
        >
          Return to sign in
        </Link>
      </div>
    </section>
  );
}

export default LoginVerify;
