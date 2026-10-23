import { API_BASE_URL, ApiError } from "../apiClient.js";

export async function fetchProjectBinary(endpoint, options = {}) {
  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("/projects/") ||
    endpoint.startsWith("//")
  ) {
    throw new TypeError("A valid Project asset endpoint is required.");
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 180000;
  let timedOut = false;

  const onAbort = () => controller.abort();

  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", onAbort, { once: true });
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "*/*" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorData = null;

      try {
        errorData = await response.json();
      } catch {
        // Non-JSON error responses are handled below.
      }

      throw new ApiError({
        message:
          errorData?.message ||
          `Project asset request failed (HTTP ${response.status}).`,
        status: response.status,
        code: errorData?.code || "PROJECT_ASSET_REQUEST_FAILED",
        url: `${API_BASE_URL}${endpoint}`,
        method: "GET",
      });
    }

    return response.blob();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error?.name === "AbortError") {
      throw new ApiError({
        message: timedOut
          ? "The Project asset download timed out."
          : "The Project asset download was canceled.",
        code: timedOut
          ? "PROJECT_ASSET_TIMEOUT"
          : "PROJECT_ASSET_ABORTED",
        cause: error,
      });
    }

    throw new ApiError({
      message: "Unable to download the Project asset.",
      code: "PROJECT_ASSET_NETWORK_ERROR",
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener?.("abort", onAbort);
  }
}

export async function createProjectBinaryObjectUrl(endpoint, options = {}) {
  const blob = await fetchProjectBinary(endpoint, options);

  return URL.createObjectURL(blob);
}