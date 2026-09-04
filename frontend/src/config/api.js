/*
 * =========================================
 * API Base URL
 * =========================================
 *
 * Local development:
 * VITE_API_BASE_URL is empty, so requests use
 * relative URLs such as /api/health. Vite then
 * proxies those requests to localhost:5000.
 *
 * Production:
 * VITE_API_BASE_URL contains the Azure backend
 * address.
 */

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");

/*
 * =========================================
 * API URL Builder
 * =========================================
 */

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

/*
 * =========================================
 * API Endpoints
 * =========================================
 */

export const API_ENDPOINTS = {
  health: buildApiUrl("/api/health"),

  generateResumeSummary: buildApiUrl("/api/ai/resume-summary"),
};
