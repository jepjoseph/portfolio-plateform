import { z } from "zod";

/*
 * =========================================
 * Boolean Environment Values
 * =========================================
 */

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

/*
 * =========================================
 * Optional Text Normalization
 * =========================================
 */

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

/*
 * =========================================
 * Boolean Normalization
 * =========================================
 */

function normalizeBooleanValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  if (TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  return value;
}

/*
 * =========================================
 * Environment Schema
 * =========================================
 */

const environmentSchema = z
  .object({
    /*
     * =========================================
     * Application
     * =========================================
     */

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().min(1).max(65535).default(5000),

    FRONTEND_URL: z.string().trim().min(1).default("http://localhost:5173"),

    PROFILE_PICTURE_STORAGE_PATH: z.preprocess(
      normalizeOptionalText,
      z.string().min(1).optional(),
    ),

    PROFILE_PICTURE_PUBLIC_BASE_URL: z.preprocess(
      normalizeOptionalText,
      z.string().url().optional(),
    ),

    /*
     * =========================================
     * Database Connection
     * =========================================
     */

    DB_HOST: z.preprocess(normalizeOptionalText, z.string().min(1).optional()),

    DB_PORT: z.coerce.number().int().min(1).max(65535).default(1433),

    DB_NAME: z.preprocess(normalizeOptionalText, z.string().min(1).optional()),

    DB_USER: z.preprocess(normalizeOptionalText, z.string().min(1).optional()),

    DB_PASSWORD: z.preprocess(
      normalizeOptionalText,
      z.string().min(1).optional(),
    ),

    /*
     * =========================================
     * Database Security
     * =========================================
     */

    DB_ENCRYPT: z.preprocess(normalizeBooleanValue, z.boolean()).default(true),

    DB_TRUST_SERVER_CERTIFICATE: z
      .preprocess(normalizeBooleanValue, z.boolean())
      .default(false),

    /*
     * =========================================
     * Database Timeouts
     * =========================================
     */

    DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),

    DB_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),

    /*
     * =========================================
     * Database Pool
     * =========================================
     */

    DB_POOL_MIN: z.coerce.number().int().min(0).default(0),

    DB_POOL_MAX: z.coerce.number().int().min(1).default(10),

    DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),

    /*
     * =========================================
     * Authentication Security Secrets
     * =========================================
     *
     * These secrets are optional while the
     * authentication routes are not active.
     *
     * Authentication utilities will reject
     * operations if the secrets are missing.
     */

    AUTH_OTP_HMAC_SECRET: z.preprocess(
      normalizeOptionalText,
      z.string().min(32).optional(),
    ),

    AUTH_TOKEN_HMAC_SECRET: z.preprocess(
      normalizeOptionalText,
      z.string().min(32).optional(),
    ),

    AUTH_IP_HMAC_SECRET: z.preprocess(
      normalizeOptionalText,
      z.string().min(32).optional(),
    ),

    /*
     * =========================================
     * Email Delivery
     * =========================================
     */

    EMAIL_PROVIDER: z.enum(["development", "resend"]).default("development"),

    EMAIL_FROM_NAME: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .default("PortAncest Portfolio Platform"),

    EMAIL_FROM_ADDRESS: z.preprocess(
      normalizeOptionalText,

      z.string().email().optional(),
    ),

    RESEND_API_KEY: z.preprocess(
      normalizeOptionalText,

      z.string().min(20).optional(),
    ),

    /*
     * Authentication Sessions
     */

    SESSION_REFRESH_TOKEN_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(30),

    SESSION_COOKIE_NAME: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "SESSION_COOKIE_NAME contains unsupported characters.",
      )
      .default("portfolio_refresh_token"),

    SESSION_COOKIE_PATH: z.string().trim().startsWith("/").default("/api"),

    SESSION_COOKIE_DOMAIN: z.preprocess(
      normalizeOptionalText,
      z.string().min(1).optional(),
    ),

    SESSION_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  })

  /*
   * =========================================
   * Cross-Field Validation
   * =========================================
   */

  .superRefine((values, context) => {
    /*
     * =========================================
     * Database Configuration Validation
     * =========================================
     */

    const databaseFields = [
      ["DB_HOST", values.DB_HOST],

      ["DB_NAME", values.DB_NAME],

      ["DB_USER", values.DB_USER],

      ["DB_PASSWORD", values.DB_PASSWORD],
    ];

    /*
     * The API can temporarily run without a
     * database.
     *
     * However, when any required database value
     * is supplied, all required database values
     * must be supplied.
     */

    const hasAnyDatabaseValue = databaseFields.some(([, value]) =>
      Boolean(value),
    );

    if (hasAnyDatabaseValue) {
      for (const [fieldName, value] of databaseFields) {
        if (!value) {
          context.addIssue({
            code: "custom",

            path: [fieldName],

            message: `${fieldName} is required when database access is configured.`,
          });
        }
      }
    }

    /*
     * =========================================
     * Database Pool Validation
     * =========================================
     */

    if (values.DB_POOL_MIN > values.DB_POOL_MAX) {
      context.addIssue({
        code: "custom",

        path: ["DB_POOL_MIN"],

        message: "DB_POOL_MIN cannot be greater than DB_POOL_MAX.",
      });
    }

    /*
     * =========================================
     * Prevents OTPs from accidentally being printed in Azure production logs
     * =========================================
     */

    if (
      values.NODE_ENV === "production" &&
      values.EMAIL_PROVIDER === "development"
    ) {
      context.addIssue({
        code: "custom",

        path: ["EMAIL_PROVIDER"],

        message: "The development email provider cannot be used in production.",
      });
    }

    if (
      values.SESSION_COOKIE_SAME_SITE === "none" &&
      values.NODE_ENV !== "production"
    ) {
      context.addIssue({
        code: "custom",

        path: ["SESSION_COOKIE_SAME_SITE"],

        message:
          'SameSite "none" requires a secure production HTTPS environment.',
      });
    }

    /*
     * =========================================
     * Resend Configuration
     * =========================================
     */

    if (values.EMAIL_PROVIDER === "resend") {
      if (!values.RESEND_API_KEY) {
        context.addIssue({
          code: "custom",

          path: ["RESEND_API_KEY"],

          message: "RESEND_API_KEY is required when EMAIL_PROVIDER is resend.",
        });
      }

      if (!values.EMAIL_FROM_ADDRESS) {
        context.addIssue({
          code: "custom",

          path: ["EMAIL_FROM_ADDRESS"],

          message:
            "EMAIL_FROM_ADDRESS is required when EMAIL_PROVIDER is resend.",
        });
      }
    }
  });

/*
 * =========================================
 * Cached Environment
 * =========================================
 */

let cachedEnvironment;

/*
 * =========================================
 * Read and Validate Environment
 * =========================================
 */

export function getEnvironment() {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
      )
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  cachedEnvironment = Object.freeze(result.data);

  return cachedEnvironment;
}

/*
 * =========================================
 * Database Configuration Status
 * =========================================
 */

export function isDatabaseConfigured(environment = getEnvironment()) {
  return Boolean(
    environment.DB_HOST &&
    environment.DB_NAME &&
    environment.DB_USER &&
    environment.DB_PASSWORD,
  );
}

/*
 * =========================================
 * Authentication Secret Access
 * =========================================
 *
 * This function prevents authentication
 * operations from running without all three
 * security secrets.
 */

export function getAuthenticationSecrets(environment = getEnvironment()) {
  const secrets = {
    otp: environment.AUTH_OTP_HMAC_SECRET,

    token: environment.AUTH_TOKEN_HMAC_SECRET,

    ip: environment.AUTH_IP_HMAC_SECRET,
  };

  const missingSecrets = Object.entries(secrets)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingSecrets.length > 0) {
    const error = new Error(
      `Authentication security secrets are missing: ${missingSecrets.join(", ")}.`,
    );

    error.name = "AuthenticationConfigurationError";

    error.code = "AUTHENTICATION_NOT_CONFIGURED";

    error.status = 503;

    error.publicMessage = "Authentication service is temporarily unavailable.";

    throw error;
  }

  return Object.freeze(secrets);
}
