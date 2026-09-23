import { apiDelete, apiGet, apiPost } from "../apiClient.js";

/*
 * =========================================
 * Session Normalization
 * =========================================
 */

function normalizeSession(session) {
  if (!session || typeof session !== "object" || !session.id) {
    return null;
  }

  return {
    id: session.id,

    deviceName:
      typeof session.deviceName === "string" && session.deviceName.trim()
        ? session.deviceName.trim()
        : "Unknown device",

    createdAt: session.createdAt || null,

    lastUsedAt: session.lastUsedAt || null,

    expiresAt: session.expiresAt || null,

    isCurrent: Boolean(session.isCurrent),
  };
}

/*
 * =========================================
 * Session ID Normalization
 * =========================================
 */

function normalizeSessionId(sessionId) {
  return typeof sessionId === "string" ? sessionId.trim() : "";
}

/*
 * =========================================
 * Get Active Sessions
 * =========================================
 *
 * GET /api/users/me/sessions
 */

export async function getActiveSessions(options = {}) {
  const response = await apiGet(
    "/users/me/sessions",

    options,
  );

  const sessions = Array.isArray(response?.data?.sessions)
    ? response.data.sessions.map(normalizeSession).filter(Boolean)
    : [];

  return {
    status: response?.status || "success",

    message: response?.message || "",

    sessions,
  };
}

/*
 * =========================================
 * Revoke One Session
 * =========================================
 *
 * DELETE /api/users/me/sessions/:sessionId
 */

export async function revokeSession(sessionId, options = {}) {
  const normalizedSessionId = normalizeSessionId(sessionId);

  if (!normalizedSessionId) {
    throw new TypeError("A session ID is required.");
  }

  const response = await apiDelete(
    `/users/me/sessions/${encodeURIComponent(normalizedSessionId)}`,

    options,
  );

  return {
    status: response?.status || "success",

    message: response?.message || "",

    sessionId: response?.data?.sessionId || normalizedSessionId,

    revokedAt: response?.data?.revokedAt || null,
  };
}

/*
 * =========================================
 * Revoke All Other Sessions
 * =========================================
 *
 * POST /api/users/me/sessions/revoke-others
 */

export async function revokeOtherSessions(options = {}) {
  const response = await apiPost(
    "/users/me/sessions/revoke-others",

    {},

    options,
  );

  return {
    status: response?.status || "success",

    message: response?.message || "",

    revokedCount: Number(response?.data?.revokedCount || 0),

    currentSessionId: response?.data?.currentSessionId || null,
  };
}

/*
 * =========================================
 * Session Service Object
 * =========================================
 */

const sessionService = Object.freeze({
  getActiveSessions,

  revokeSession,

  revokeOtherSessions,
});

export default sessionService;
