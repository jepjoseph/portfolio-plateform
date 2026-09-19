import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  completeRegistration as completeRegistrationService,
  getCurrentSession,
  logout as logoutService,
  refreshSession,
  requestPasswordLogin,
  requestRegistrationOtp,
  verifyLoginOtp,
  verifyRegistrationOtp,
} from "../services/Auth/authService.js";

/*
 * =========================================
 * Authentication Status
 * =========================================
 */

export const AUTH_STATUS = Object.freeze({
  INITIALIZING: "initializing",

  AUTHENTICATED: "authenticated",

  UNAUTHENTICATED: "unauthenticated",

  ERROR: "error",
});

/*
 * =========================================
 * Authentication Operations
 * =========================================
 */

export const AUTH_OPERATION = Object.freeze({
  IDLE: "idle",

  RESTORING: "restoring",

  REQUESTING_REGISTRATION: "requesting-registration",

  VERIFYING_REGISTRATION: "verifying-registration",

  COMPLETING_REGISTRATION: "completing-registration",

  REQUESTING_LOGIN: "requesting-login",

  VERIFYING_LOGIN: "verifying-login",

  REFRESHING: "refreshing",

  LOGGING_OUT: "logging-out",
});

/*
 * =========================================
 * Context
 * =========================================
 */

const AuthContext = createContext(null);

/*
 * =========================================
 * Role Normalization
 * =========================================
 */

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }

  return [
    ...new Set(
      roles
        .map((role) =>
          typeof role === "string" ? role.trim().toLowerCase() : "",
        )
        .filter(Boolean),
    ),
  ];
}

/*
 * =========================================
 * Authentication Data
 * =========================================
 */

function normalizeAuthentication(result) {
  if (!result?.user?.id || !result?.session?.id) {
    return null;
  }

  return {
    user: result.user,

    roles: normalizeRoles(result.roles),

    session: result.session,
  };
}

/*
 * =========================================
 * Expected Unauthenticated Errors
 * =========================================
 */

function isUnauthenticatedError(error) {
  return (
    Number(error?.status) === 401 ||
    [
      "AUTHENTICATION_REQUIRED",
      "SESSION_REFRESH_TOKEN_INVALID",
      "SESSION_NOT_FOUND",
    ].includes(error?.code)
  );
}

/*
 * =========================================
 * Provider
 * =========================================
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [roles, setRoles] = useState([]);

  const [session, setSession] = useState(null);

  const [status, setStatus] = useState(AUTH_STATUS.INITIALIZING);

  const [operation, setOperation] = useState(AUTH_OPERATION.IDLE);

  const [error, setError] = useState(null);

  /*
   * Prevent state updates after an actual
   * provider unmount.
   */

  const isMountedRef = useRef(false);

  /*
   * Prevent duplicate restoration and token
   * rotation requests.
   */

  const restorationPromiseRef = useRef(null);

  const refreshPromiseRef = useRef(null);

  /*
   * =========================================
   * Safe State Helpers
   * =========================================
   */

  const clearAuthentication = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setUser(null);

    setRoles([]);

    setSession(null);

    setStatus(AUTH_STATUS.UNAUTHENTICATED);
  }, []);

  const applyAuthentication = useCallback((result) => {
    const authentication = normalizeAuthentication(result);

    if (!authentication) {
      const authenticationError = new Error(
        "The server returned an incomplete authentication response.",
      );

      authenticationError.name = "AuthenticationResponseError";

      authenticationError.code = "AUTHENTICATION_RESPONSE_INVALID";

      throw authenticationError;
    }

    if (!isMountedRef.current) {
      return authentication;
    }

    setUser(authentication.user);

    setRoles(authentication.roles);

    setSession(authentication.session);

    setStatus(AUTH_STATUS.AUTHENTICATED);

    setError(null);

    return authentication;
  }, []);

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  /*
   * =========================================
   * Restore Existing Session
   * =========================================
   *
   * A missing or expired cookie is an ordinary
   * unauthenticated state, not an application
   * failure.
   */

  const restoreAuthentication = useCallback(async () => {
    if (restorationPromiseRef.current) {
      return restorationPromiseRef.current;
    }

    const restorationPromise = (async () => {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.RESTORING);

        setError(null);
      }

      try {
        const result = await getCurrentSession();

        return applyAuthentication(result);
      } catch (restorationError) {
        if (isUnauthenticatedError(restorationError)) {
          clearAuthentication();

          return null;
        }

        if (isMountedRef.current) {
          setUser(null);

          setRoles([]);

          setSession(null);

          setStatus(AUTH_STATUS.ERROR);

          setError(restorationError);
        }

        return null;
      } finally {
        if (isMountedRef.current) {
          setOperation(AUTH_OPERATION.IDLE);
        }
      }
    })();

    restorationPromiseRef.current = restorationPromise;

    try {
      return await restorationPromise;
    } finally {
      if (restorationPromiseRef.current === restorationPromise) {
        restorationPromiseRef.current = null;
      }
    }
  }, [applyAuthentication, clearAuthentication]);

  /*
   * =========================================
   * Begin Registration
   * =========================================
   *
   * This creates a registration challenge and
   * requests delivery of the registration OTP.
   * It does not authenticate the browser.
   */

  const beginRegistration = useCallback(async ({ email }) => {
    if (isMountedRef.current) {
      setOperation(AUTH_OPERATION.REQUESTING_REGISTRATION);

      setError(null);
    }

    try {
      return await requestRegistrationOtp({
        email,
      });
    } catch (registrationError) {
      if (isMountedRef.current) {
        setError(registrationError);
      }

      throw registrationError;
    } finally {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.IDLE);
      }
    }
  }, []);

  /*
   * =========================================
   * Verify Registration OTP
   * =========================================
   *
   * Successful verification returns a
   * short-lived continuation token. It does
   * not create the account or session yet.
   */

  const verifyRegistration = useCallback(async ({ challengeId, otp }) => {
    if (isMountedRef.current) {
      setOperation(AUTH_OPERATION.VERIFYING_REGISTRATION);

      setError(null);
    }

    try {
      return await verifyRegistrationOtp({
        challengeId,

        otp,
      });
    } catch (verificationError) {
      if (isMountedRef.current) {
        setError(verificationError);
      }

      throw verificationError;
    } finally {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.IDLE);
      }
    }
  }, []);

  /*
   * =========================================
   * Complete Registration
   * =========================================
   *
   * This creates the user, initial profile,
   * settings and standard user role. It does
   * not create an authenticated session.
   */

  const finishRegistration = useCallback(
    async ({ challengeId, continuationToken, password }) => {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.COMPLETING_REGISTRATION);

        setError(null);
      }

      try {
        return await completeRegistrationService({
          challengeId,

          continuationToken,

          password,
        });
      } catch (registrationError) {
        if (isMountedRef.current) {
          setError(registrationError);
        }

        throw registrationError;
      } finally {
        if (isMountedRef.current) {
          setOperation(AUTH_OPERATION.IDLE);
        }
      }
    },
    [],
  );

  /*
   * =========================================
   * Begin Password Login
   * =========================================
   *
   * This validates the password and requests
   * an OTP. It does not authenticate the
   * browser yet.
   */

  const beginPasswordLogin = useCallback(async ({ email, password }) => {
    if (isMountedRef.current) {
      setOperation(AUTH_OPERATION.REQUESTING_LOGIN);

      setError(null);
    }

    try {
      return await requestPasswordLogin({
        email,

        password,
      });
    } catch (loginError) {
      if (isMountedRef.current) {
        setError(loginError);
      }

      throw loginError;
    } finally {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.IDLE);
      }
    }
  }, []);

  /*
   * =========================================
   * Complete Login OTP
   * =========================================
   *
   * Successful verification creates the
   * server session and HttpOnly cookie.
   */

  const completeLogin = useCallback(
    async ({ challengeId, otp }) => {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.VERIFYING_LOGIN);

        setError(null);
      }

      try {
        const result = await verifyLoginOtp({
          challengeId,

          otp,
        });

        applyAuthentication(result);

        return result;
      } catch (verificationError) {
        if (isMountedRef.current) {
          setError(verificationError);
        }

        throw verificationError;
      } finally {
        if (isMountedRef.current) {
          setOperation(AUTH_OPERATION.IDLE);
        }
      }
    },
    [applyAuthentication],
  );

  /*
   * =========================================
   * Refresh Session
   * =========================================
   *
   * Only one refresh may run at a time because
   * every successful refresh invalidates the
   * previous refresh token.
   */

  const refreshAuthentication = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.REFRESHING);

        setError(null);
      }

      try {
        const result = await refreshSession();

        applyAuthentication(result);

        return result;
      } catch (refreshError) {
        if (
          isUnauthenticatedError(refreshError) ||
          refreshError?.code === "SESSION_REFRESH_CONFLICT"
        ) {
          clearAuthentication();
        }

        if (isMountedRef.current) {
          setError(refreshError);
        }

        throw refreshError;
      } finally {
        if (isMountedRef.current) {
          setOperation(AUTH_OPERATION.IDLE);
        }
      }
    })();

    refreshPromiseRef.current = refreshPromise;

    try {
      return await refreshPromise;
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null;
      }
    }
  }, [applyAuthentication, clearAuthentication]);

  /*
   * =========================================
   * Logout
   * =========================================
   */

  const logout = useCallback(async () => {
    if (isMountedRef.current) {
      setOperation(AUTH_OPERATION.LOGGING_OUT);

      setError(null);
    }

    try {
      const result = await logoutService();

      clearAuthentication();

      return result;
    } catch (logoutError) {
      /*
       * The backend intentionally preserves
       * the cookie when database revocation
       * fails, so keep the local identity
       * until logout actually succeeds.
       */

      if (isMountedRef.current) {
        setError(logoutError);
      }

      throw logoutError;
    } finally {
      if (isMountedRef.current) {
        setOperation(AUTH_OPERATION.IDLE);
      }
    }
  }, [clearAuthentication]);

  /*
   * =========================================
   * Role Lookup
   * =========================================
   */

  const hasRole = useCallback(
    (roleName) => {
      const normalizedRole =
        typeof roleName === "string" ? roleName.trim().toLowerCase() : "";

      return Boolean(normalizedRole && roles.includes(normalizedRole));
    },
    [roles],
  );

  /*
   * =========================================
   * Initial Session Restoration
   * =========================================
   */

  useEffect(() => {
    isMountedRef.current = true;

    void restoreAuthentication();

    return () => {
      isMountedRef.current = false;
    };
  }, [restoreAuthentication]);

  /*
   * =========================================
   * Derived State
   * =========================================
   */

  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED;

  const isInitializing = status === AUTH_STATUS.INITIALIZING;

  const isBusy = operation !== AUTH_OPERATION.IDLE;

  /*
   * =========================================
   * Context Value
   * =========================================
   */

  const contextValue = useMemo(
    () => ({
      /*
       * Identity
       */

      user,

      roles,

      session,

      /*
       * Status
       */

      status,

      operation,

      error,

      isAuthenticated,

      isInitializing,

      isBusy,

      /*
       * Authentication Actions
       */

      restoreAuthentication,

      beginRegistration,

      verifyRegistration,

      finishRegistration,

      beginPasswordLogin,

      completeLogin,

      refreshAuthentication,

      logout,

      /*
       * Utilities
       */

      hasRole,

      clearError,
    }),
    [
      user,
      roles,
      session,
      status,
      operation,
      error,
      isAuthenticated,
      isInitializing,
      isBusy,
      restoreAuthentication,
      beginRegistration,
      beginPasswordLogin,
      completeLogin,
      refreshAuthentication,
      logout,
      hasRole,
      clearError,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/*
 * =========================================
 * Authentication Hook
 * =========================================
 */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
