import { apiPost } from "../apiClient.js";

/*
 * =========================================
 * Response Normalization
 * =========================================
 */

function normalizeContactResponse(response) {
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

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

/*
 * =========================================
 * Submit Contact Request
 * =========================================
 *
 * POST /api/support/contact
 */

export async function submitContactRequest(
  { name, email, category, subject, message, replyConsent },
  options = {},
) {
  const response = await apiPost(
    "/support/contact",

    {
      name: normalizeText(name),

      email: normalizeEmail(email),

      category: normalizeText(category),

      subject: normalizeText(subject),

      message: normalizeText(message),

      replyConsent: Boolean(replyConsent),
    },

    options,
  );

  return normalizeContactResponse(response);
}

/*
 * =========================================
 * Contact Service
 * =========================================
 */

const contactService = Object.freeze({
  submitContactRequest,
});

export default contactService;
