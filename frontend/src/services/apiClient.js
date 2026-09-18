/*
 * =========================================
 * API Configuration
 * =========================================
 */

const DEFAULT_API_ORIGIN = "http://localhost:5000";

const DEFAULT_TIMEOUT_MS = 30000;

/*
 * VITE_API_BASE_URL may be configured as:
 *
 * http://localhost:5000
 *
 * or:
 *
 * http://localhost:5000/api
 *
 * Both formats are supported.
 */

function normalizeApiBaseUrl(value) {
  const configuredValue = typeof value === "string" ? value.trim() : "";

  const baseUrl = (configuredValue || DEFAULT_API_ORIGIN).replace(/\/+$/, "");

  return /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
);

/*
 * =========================================
 * API Error
 * =========================================
 */

export class ApiError extends Error {
  constructor({
    message,
    status = 0,
    code = "API_REQUEST_FAILED",
    fieldErrors = {},
    errors = [],
    details = null,
    method = "",
    url = "",
    cause,
  }) {
    super(message || "The request could not be completed.", {
      cause,
    });

    this.name = "ApiError";

    this.status = Number(status) || 0;

    this.code = code || "API_REQUEST_FAILED";

    this.fieldErrors =
      fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {};

    this.errors = Array.isArray(errors) ? errors : [];

    this.details = details || null;

    this.method = method;

    this.url = url;
  }
}

/*
 * =========================================
 * Endpoint Normalization
 * =========================================
 */

function normalizeEndpoint(endpoint) {
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw new TypeError("A relative API endpoint is required.");
  }

  const normalizedEndpoint = endpoint.trim();

  /*
   * Prevent accidental cookie-bearing
   * requests to arbitrary external origins.
   */

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(normalizedEndpoint)) {
    throw new TypeError("API endpoints must be relative paths.");
  }

  return normalizedEndpoint.startsWith("/")
    ? normalizedEndpoint
    : `/${normalizedEndpoint}`;
}

/*
 * =========================================
 * Query Parameters
 * =========================================
 */

function appendQueryParameters(url, query) {
  if (!query || typeof query !== "object") {
    return url;
  }

  const requestUrl = new URL(url);

  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        requestUrl.searchParams.append(name, String(item));
      }

      continue;
    }

    requestUrl.searchParams.set(name, String(value));
  }

  return requestUrl.toString();
}

/*
 * =========================================
 * Request Body Preparation
 * =========================================
 */

function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isUrlSearchParams(value) {
  return (
    typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams
  );
}

function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function shouldSerializeAsJson(body) {
  return (
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !isFormData(body) &&
    !isUrlSearchParams(body) &&
    !isBlob(body) &&
    !(body instanceof ArrayBuffer)
  );
}

function prepareRequestBody({ body, headers }) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (shouldSerializeAsJson(body)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return JSON.stringify(body);
  }

  /*
   * Never set Content-Type manually for
   * FormData. The browser must add its
   * multipart boundary.
   */

  return body;
}

/*
 * =========================================
 * Response Parsing
 * =========================================
 */

async function parseResponseBody(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return {
        message: "The server returned an invalid JSON response.",
      };
    }
  }

  /*
   * Some development proxies may omit the
   * JSON content type. Attempt JSON parsing
   * before treating the body as plain text.
   */

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

/*
 * =========================================
 * API Error Creation
 * =========================================
 */

function createResponseError({ response, data, method, url }) {
  return new ApiError({
    message: data?.message || `The server returned HTTP ${response.status}.`,

    status: response.status,

    code: data?.code || "API_REQUEST_FAILED",

    fieldErrors: data?.fieldErrors,

    errors: data?.errors,

    details: data?.details,

    method,

    url,
  });
}

/*
 * =========================================
 * Timeout and Abort Signal
 * =========================================
 */

function createRequestAbortController({ signal, timeoutMs }) {
  const controller = new AbortController();

  let wasTimedOut = false;

  const handleExternalAbort = () => {
    controller.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      handleExternalAbort();
    } else {
      signal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  const timeoutId = window.setTimeout(() => {
    wasTimedOut = true;

    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,

    wasTimedOut() {
      return wasTimedOut;
    },

    cleanup() {
      window.clearTimeout(timeoutId);

      signal?.removeEventListener?.("abort", handleExternalAbort);
    },
  };
}

/*
 * =========================================
 * API Request
 * =========================================
 */

export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body,
    query,
    headers: customHeaders,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = "no-store",
  } = {},
) {
  const normalizedMethod = String(method).trim().toUpperCase() || "GET";

  const normalizedEndpoint = normalizeEndpoint(endpoint);

  const requestUrl = appendQueryParameters(
    `${API_BASE_URL}${normalizedEndpoint}`,
    query,
  );

  const headers = new Headers(customHeaders || {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const requestBody = prepareRequestBody({
    body,

    headers,
  });

  const abortState = createRequestAbortController({
    signal,

    timeoutMs: Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_TIMEOUT_MS,
  });

  try {
    const response = await fetch(requestUrl, {
      method: normalizedMethod,

      /*
       * Required for HttpOnly session
       * cookies on cross-origin requests.
       */

      credentials: "include",

      headers,

      body: ["GET", "HEAD"].includes(normalizedMethod)
        ? undefined
        : requestBody,

      signal: abortState.signal,

      cache,
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw createResponseError({
        response,

        data,

        method: normalizedMethod,

        url: requestUrl,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new ApiError({
        message: abortState.wasTimedOut()
          ? "The server took too long to respond."
          : "The request was canceled.",

        status: 0,

        code: abortState.wasTimedOut()
          ? "API_REQUEST_TIMEOUT"
          : "API_REQUEST_ABORTED",

        method: normalizedMethod,

        url: requestUrl,

        cause: error,
      });
    }

    throw new ApiError({
      message:
        "Unable to connect to the server. Check your connection and try again.",

      status: 0,

      code: "API_NETWORK_ERROR",

      method: normalizedMethod,

      url: requestUrl,

      cause: error,
    });
  } finally {
    abortState.cleanup();
  }
}

/*
 * =========================================
 * Convenience Methods
 * =========================================
 */

export function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,

    method: "GET",
  });
}

export function apiPost(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,

    method: "POST",

    body,
  });
}

export function apiPut(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,

    method: "PUT",

    body,
  });
}

export function apiPatch(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,

    method: "PATCH",

    body,
  });
}

export function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,

    method: "DELETE",
  });
}
