import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";

import {
  getActiveSessions,
  revokeOtherSessions,
  revokeSession,
} from "../../services/Account/sessionService.js";

import "./Settings.css";

/*
 * =========================================
 * Date Formatting
 * =========================================
 */

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(date);
}

/*
 * =========================================
 * Relative Activity
 * =========================================
 */

function formatRelativeActivity(value) {
  if (!value) {
    return "Activity time unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Activity time unavailable";
  }

  const differenceMilliseconds = Date.now() - date.getTime();

  if (differenceMilliseconds < 0) {
    return formatDateTime(value);
  }

  const differenceMinutes = Math.floor(differenceMilliseconds / (60 * 1000));

  if (differenceMinutes < 1) {
    return "Active less than a minute ago";
  }

  if (differenceMinutes < 60) {
    return `Active ${differenceMinutes} minute${
      differenceMinutes === 1 ? "" : "s"
    } ago`;
  }

  const differenceHours = Math.floor(differenceMinutes / 60);

  if (differenceHours < 24) {
    return `Active ${differenceHours} hour${
      differenceHours === 1 ? "" : "s"
    } ago`;
  }

  const differenceDays = Math.floor(differenceHours / 24);

  if (differenceDays < 30) {
    return `Active ${differenceDays} day${differenceDays === 1 ? "" : "s"} ago`;
  }

  return `Last active ${formatDateTime(value)}`;
}

/*
 * =========================================
 * Device Icon
 * =========================================
 */

function getDeviceIcon(deviceName) {
  const normalizedDeviceName =
    typeof deviceName === "string" ? deviceName.toLowerCase() : "";

  if (
    normalizedDeviceName.includes("iphone") ||
    normalizedDeviceName.includes("ios") ||
    normalizedDeviceName.includes("android") ||
    normalizedDeviceName.includes("phone")
  ) {
    return "▯";
  }

  if (
    normalizedDeviceName.includes("postman") ||
    normalizedDeviceName.includes("insomnia") ||
    normalizedDeviceName.includes("curl") ||
    normalizedDeviceName.includes("httpie")
  ) {
    return "⌘";
  }

  return "▰";
}

/*
 * =========================================
 * Settings Page
 * =========================================
 */

function Settings() {
  const { user, session: authenticatedSession } = useAuth();

  const [sessions, setSessions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [pageError, setPageError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [revokingSessionId, setRevokingSessionId] = useState("");

  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  const mutationControllerRef = useRef(null);

  /*
   * =========================================
   * Derived Sessions
   * =========================================
   */

  const orderedSessions = useMemo(
    () =>
      [...sessions].sort((firstSession, secondSession) => {
        if (firstSession.isCurrent && !secondSession.isCurrent) {
          return -1;
        }

        if (!firstSession.isCurrent && secondSession.isCurrent) {
          return 1;
        }

        const firstActivity = new Date(
          firstSession.lastUsedAt || firstSession.createdAt || 0,
        ).getTime();

        const secondActivity = new Date(
          secondSession.lastUsedAt || secondSession.createdAt || 0,
        ).getTime();

        return secondActivity - firstActivity;
      }),
    [sessions],
  );

  const otherSessionCount = sessions.filter(
    (activeSession) => !activeSession.isCurrent,
  ).length;

  const isMutating = Boolean(revokingSessionId || isRevokingOthers);

  /*
   * =========================================
   * Document Title
   * =========================================
   */

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Settings | Portfolio Platform";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * =========================================
   * Load Sessions
   * =========================================
   */

  const loadSessions = useCallback(async ({ signal } = {}) => {
    setIsLoading(true);
    setPageError("");

    try {
      const result = await getActiveSessions({
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      setSessions(result.sessions);
    } catch (error) {
      if (signal?.aborted || error?.code === "API_REQUEST_ABORTED") {
        return;
      }

      setPageError(
        error?.message ||
          "Your active sessions could not be loaded. Please try again.",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadSessions({
      signal: controller.signal,
    });

    return () => {
      controller.abort();

      mutationControllerRef.current?.abort();
    };
  }, [loadSessions]);

  /*
   * =========================================
   * Revoke One Remote Session
   * =========================================
   */

  async function handleRevokeSession(activeSession) {
    if (!activeSession?.id || activeSession.isCurrent || isMutating) {
      return;
    }

    const shouldRevoke = window.confirm(
      `Revoke "${activeSession.deviceName}"?\n\nThat device will need to sign in again.`,
    );

    if (!shouldRevoke) {
      return;
    }

    mutationControllerRef.current?.abort();

    const controller = new AbortController();

    mutationControllerRef.current = controller;

    setRevokingSessionId(activeSession.id);
    setPageError("");
    setSuccessMessage("");

    try {
      const result = await revokeSession(activeSession.id, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setSuccessMessage(
        result.message || "The selected session was revoked successfully.",
      );

      await loadSessions({
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || error?.code === "API_REQUEST_ABORTED") {
        return;
      }

      setPageError(
        error?.message ||
          "The selected session could not be revoked. Please try again.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setRevokingSessionId("");
      }

      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
      }
    }
  }

  /*
   * =========================================
   * Revoke All Other Sessions
   * =========================================
   */

  async function handleRevokeOtherSessions() {
    if (otherSessionCount === 0 || isMutating) {
      return;
    }

    const shouldRevoke = window.confirm(
      `Revoke ${otherSessionCount} other active session${
        otherSessionCount === 1 ? "" : "s"
      }?\n\nEvery other device will need to sign in again. Your current device will remain signed in.`,
    );

    if (!shouldRevoke) {
      return;
    }

    mutationControllerRef.current?.abort();

    const controller = new AbortController();

    mutationControllerRef.current = controller;

    setIsRevokingOthers(true);
    setPageError("");
    setSuccessMessage("");

    try {
      const result = await revokeOtherSessions({
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setSuccessMessage(
        result.message ||
          `${result.revokedCount} other sessions were revoked successfully.`,
      );

      await loadSessions({
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || error?.code === "API_REQUEST_ABORTED") {
        return;
      }

      setPageError(
        error?.message ||
          "Your other sessions could not be revoked. Please try again.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsRevokingOthers(false);
      }

      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
      }
    }
  }

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <div>
          <span className="settings-eyebrow">Account settings</span>

          <h1>Security and active sessions</h1>

          <p>
            Review the devices currently signed in to your account and revoke
            access from devices you no longer recognize or use.
          </p>
        </div>

        <div className="settings-account-summary">
          <span>Signed in as</span>

          <strong>{user?.email || "Authenticated user"}</strong>
        </div>
      </header>

      <section className="settings-security-summary">
        <article>
          <span className="settings-summary-icon" aria-hidden="true">
            ✓
          </span>

          <div>
            <strong>Protected account access</strong>

            <p>
              Password verification and one-time email codes protect new
              sign-ins.
            </p>
          </div>
        </article>

        <article>
          <span className="settings-summary-icon" aria-hidden="true">
            ◇
          </span>

          <div>
            <strong>Current session</strong>

            <p>
              {authenticatedSession?.deviceName ||
                "Your current browser session"}
            </p>
          </div>
        </article>

        <article>
          <span className="settings-summary-icon" aria-hidden="true">
            {otherSessionCount}
          </span>

          <div>
            <strong>Other active sessions</strong>

            <p>
              {otherSessionCount === 0
                ? "No other devices are signed in."
                : `${otherSessionCount} other device${
                    otherSessionCount === 1 ? " is" : "s are"
                  } signed in.`}
            </p>
          </div>
        </article>
      </section>

      {pageError ? (
        <div className="settings-message settings-message--error" role="alert">
          <span aria-hidden="true">!</span>

          <div>
            <strong>Session action unsuccessful</strong>

            <p>{pageError}</p>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="settings-message settings-message--success"
          role="status"
        >
          <span aria-hidden="true">✓</span>

          <div>
            <strong>Session access updated</strong>

            <p>{successMessage}</p>
          </div>
        </div>
      ) : null}

      <section
        className="settings-sessions-section"
        aria-labelledby="active-sessions-heading"
      >
        <div className="settings-section-header">
          <div>
            <span className="settings-eyebrow">Device access</span>

            <h2 id="active-sessions-heading">Active sessions</h2>

            <p>
              If you do not recognize a session, revoke it and consider changing
              your password.
            </p>
          </div>

          <div className="settings-section-actions">
            <button
              type="button"
              className="settings-refresh-button"
              onClick={() => {
                setSuccessMessage("");

                void loadSessions();
              }}
              disabled={isLoading || isMutating}
            >
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              type="button"
              className="settings-revoke-all-button"
              onClick={handleRevokeOtherSessions}
              disabled={isLoading || isMutating || otherSessionCount === 0}
            >
              {isRevokingOthers ? "Revoking…" : "Revoke All Other Sessions"}
            </button>
          </div>
        </div>

        <div className="settings-session-list">
          {isLoading ? (
            <div className="settings-loading" role="status">
              <span className="settings-loading-spinner" aria-hidden="true" />

              <div>
                <strong>Loading active sessions</strong>

                <p>Please wait while your device access is reviewed.</p>
              </div>
            </div>
          ) : null}

          {!isLoading && orderedSessions.length === 0 && !pageError ? (
            <div className="settings-empty-state">
              <span aria-hidden="true">◇</span>

              <h3>No active sessions were returned</h3>

              <p>
                Refresh the page. If the problem continues, sign out and sign in
                again.
              </p>
            </div>
          ) : null}

          {!isLoading
            ? orderedSessions.map((activeSession) => {
                const isBeingRevoked = revokingSessionId === activeSession.id;

                return (
                  <article
                    key={activeSession.id}
                    className={
                      activeSession.isCurrent
                        ? "settings-session-card settings-session-card--current"
                        : "settings-session-card"
                    }
                  >
                    <div className="settings-device-icon" aria-hidden="true">
                      {getDeviceIcon(activeSession.deviceName)}
                    </div>

                    <div className="settings-session-information">
                      <div className="settings-session-title-row">
                        <h3>{activeSession.deviceName}</h3>

                        {activeSession.isCurrent ? (
                          <span className="settings-current-badge">
                            Current device
                          </span>
                        ) : null}
                      </div>

                      <p className="settings-session-activity">
                        {formatRelativeActivity(
                          activeSession.lastUsedAt || activeSession.createdAt,
                        )}
                      </p>

                      <dl className="settings-session-details">
                        <div>
                          <dt>Signed in</dt>

                          <dd>{formatDateTime(activeSession.createdAt)}</dd>
                        </div>

                        <div>
                          <dt>Last activity</dt>

                          <dd>{formatDateTime(activeSession.lastUsedAt)}</dd>
                        </div>

                        <div>
                          <dt>Expires</dt>

                          <dd>{formatDateTime(activeSession.expiresAt)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="settings-session-action">
                      {activeSession.isCurrent ? (
                        <span className="settings-current-message">
                          Use Log Out to end this session.
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            void handleRevokeSession(activeSession);
                          }}
                          disabled={isMutating}
                        >
                          {isBeingRevoked ? "Revoking…" : "Revoke Session"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      </section>

      <section className="settings-security-guidance">
        <div>
          <span className="settings-eyebrow">Security guidance</span>

          <h2>Do you see a device you do not recognize?</h2>
        </div>

        <ol>
          <li>
            Revoke the unfamiliar session so its refresh token can no longer
            access your account.
          </li>

          <li>
            Change your account password when password-management support is
            available.
          </li>

          <li>
            Protect your email account because sign-in verification codes are
            delivered there.
          </li>
        </ol>
      </section>
    </div>
  );
}

export default Settings;
