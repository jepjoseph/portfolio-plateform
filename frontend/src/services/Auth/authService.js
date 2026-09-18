import { apiGet, apiPost } from "../apiClient.js";

/*
 * =========================================
 * Response Normalization
 * =========================================
 *
 * Backend responses use:
 *
 * {
 *   status,
 *   message,
 *   data
 * }
 *
 * Frontend callers receive a convenient flat
 * result while preserving status and message.
 */

function normalizeAuthResponse(response) {
  return {
    status: response?.status || "success",

    message: response?.message || "",

    ...(response?.data && typeof response.data === "object"
      ? response.data
      : {}),
  };
}

/*
 * =========================================
 * Input Normalization
 * =========================================
 */

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeChallengeId(challengeId) {
  return typeof challengeId === "string" ? challengeId.trim() : "";
}

function normalizeOtp(otp) {
  return typeof otp === "string" ? otp.trim() : "";
}

function normalizeContinuationToken(continuationToken) {
  return typeof continuationToken === "string" ? continuationToken.trim() : "";
}

/*
 * =========================================
 * Registration
 * =========================================
 */

/*
 * POST /api/auth/register/request
 */

export async function requestRegistrationOtp({ email }, options = {}) {
  const response = await apiPost(
    "/auth/register/request",

    {
      email: normalizeEmail(email),
    },

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * POST /api/auth/register/verify
 */

export async function verifyRegistrationOtp(
  { challengeId, otp },
  options = {},
) {
  const response = await apiPost(
    "/auth/register/verify",

    {
      challengeId: normalizeChallengeId(challengeId),

      otp: normalizeOtp(otp),
    },

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * POST /api/auth/register/complete
 */

export async function completeRegistration(
  { challengeId, continuationToken, password },
  options = {},
) {
  const response = await apiPost(
    "/auth/register/complete",

    {
      challengeId: normalizeChallengeId(challengeId),

      continuationToken: normalizeContinuationToken(continuationToken),

      /*
       * Passwords must not be trimmed or
       * otherwise modified automatically.
       */

      password: typeof password === "string" ? password : "",
    },

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * =========================================
 * Password Login
 * =========================================
 */

/*
 * POST /api/auth/login/password
 */

export async function requestPasswordLogin({ email, password }, options = {}) {
  const response = await apiPost(
    "/auth/login/password",

    {
      email: normalizeEmail(email),

      /*
       * Preserve the password exactly as the
       * user entered it.
       */

      password: typeof password === "string" ? password : "",
    },

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * POST /api/auth/login/verify
 *
 * A successful response causes the browser
 * to store the HttpOnly refresh-token cookie.
 */

export async function verifyLoginOtp({ challengeId, otp }, options = {}) {
  const response = await apiPost(
    "/auth/login/verify",

    {
      challengeId: normalizeChallengeId(challengeId),

      otp: normalizeOtp(otp),
    },

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * =========================================
 * Session Restoration
 * =========================================
 */

/*
 * GET /api/auth/session
 *
 * Reads the existing HttpOnly cookie without
 * rotating its refresh token.
 */

export async function getCurrentSession(options = {}) {
  const response = await apiGet(
    "/auth/session",

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * POST /api/auth/session/refresh
 *
 * Rotates the refresh token. The new token is
 * delivered through a replacement HttpOnly
 * cookie and never appears in JavaScript.
 */

export async function refreshSession(options = {}) {
  const response = await apiPost(
    "/auth/session/refresh",

    {},

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * =========================================
 * Current User
 * =========================================
 */

/*
 * GET /api/users/me
 *
 * This route verifies the protected-route
 * authentication middleware.
 */

export async function getCurrentUser(options = {}) {
  const response = await apiGet(
    "/users/me",

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * =========================================
 * Logout
 * =========================================
 */

/*
 * POST /api/auth/logout
 *
 * Revokes the database session and clears
 * the HttpOnly refresh-token cookie.
 */

export async function logout(options = {}) {
  const response = await apiPost(
    "/auth/logout",

    {},

    options,
  );

  return normalizeAuthResponse(response);
}

/*
 * =========================================
 * Auth Service Object
 * =========================================
 *
 * Named exports remain available for direct
 * imports. This object is useful when the
 * complete service is preferred.
 */

const authService = Object.freeze({
  requestRegistrationOtp,

  verifyRegistrationOtp,

  completeRegistration,

  requestPasswordLogin,

  verifyLoginOtp,

  getCurrentSession,

  refreshSession,

  getCurrentUser,

  logout,
});

export default authService;
