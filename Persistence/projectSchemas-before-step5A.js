const PROJECT_ID_PATTERN =
  /^project-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CATEGORIES = new Set([
  "software",
  "web-application",
  "mobile-application",
  "artificial-intelligence",
  "data",
  "cloud-infrastructure",
  "networking",
  "cybersecurity",
  "embedded-systems",
  "electronics",
  "automation",
  "internet-of-things",
  "research",
  "design",
  "business",
  "academic",
  "community",
  "other",
]);

const LIFECYCLE_STATUSES = new Set([
  "planned",
  "in-progress",
  "completed",
  "maintained",
  "paused",
  "cancelled",
]);

const RECORD_STATUSES = new Set([
  "active",
  "archived",
]);

const SERVER_OWNED_FIELDS = [
  "userId",
  "user_id",
  "createdAt",
  "updatedAt",
  "rowVersion",
];

function createValidationError(errors) {
  const error = new Error("Project validation failed.");

  error.name = "ProjectValidationError";
  error.code = "PROJECT_VALIDATION_FAILED";
  error.status = 400;
  error.publicMessage = "Please correct the Project information.";
  error.errors = errors;

  error.fieldErrors = {};

  for (const item of errors) {
    if (!error.fieldErrors[item.field]) {
      error.fieldErrors[item.field] = item.message;
    }
  }

  return error;
}

function addError(errors, field, code, message) {
  errors.push({ field, code, message });
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isValidProjectDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  const match = value.match(
    /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/,
  );

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseProjectInput(value) {
  const errors = [];

  if (!isPlainObject(value)) {
    throw createValidationError([
      {
        field: "project",
        code: "PROJECT_OBJECT_REQUIRED",
        message: "Project data must be an object.",
      },
    ]);
  }

  for (const field of SERVER_OWNED_FIELDS) {
    if (Object.hasOwn(value, field)) {
      addError(
        errors,
        field,
        "PROJECT_SERVER_FIELD_FORBIDDEN",
        `${field} cannot be supplied by the client.`,
      );
    }
  }

  if (
    typeof value.id !== "string" ||
    !PROJECT_ID_PATTERN.test(value.id)
  ) {
    addError(
      errors,
      "id",
      "PROJECT_ID_INVALID",
      "A valid Project identifier is required.",
    );
  }

  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.trim().length > 200
  ) {
    addError(
      errors,
      "title",
      "PROJECT_TITLE_INVALID",
      "Project title must contain 1 to 200 characters.",
    );
  }

  if (
    typeof value.role !== "string" ||
    !value.role.trim() ||
    value.role.trim().length > 160
  ) {
    addError(
      errors,
      "role",
      "PROJECT_ROLE_INVALID",
      "Project role must contain 1 to 160 characters.",
    );
  }

  if (!CATEGORIES.has(value.category)) {
    addError(
      errors,
      "category",
      "PROJECT_CATEGORY_INVALID",
      "Select a valid Project category.",
    );
  }

  if (!LIFECYCLE_STATUSES.has(value.lifecycleStatus)) {
    addError(
      errors,
      "lifecycleStatus",
      "PROJECT_LIFECYCLE_INVALID",
      "Select a valid lifecycle status.",
    );
  }

  if (!RECORD_STATUSES.has(value.recordStatus)) {
    addError(
      errors,
      "recordStatus",
      "PROJECT_RECORD_STATUS_INVALID",
      "Select a valid record status.",
    );
  }

  if (!isPlainObject(value.dates)) {
    addError(
      errors,
      "dates",
      "PROJECT_DATES_INVALID",
      "Project dates must be an object.",
    );
  } else {
    if (!isValidProjectDate(value.dates.startDate)) {
      addError(
        errors,
        "dates.startDate",
        "PROJECT_START_DATE_INVALID",
        "A valid Project start date is required.",
      );
    }

    if (
      value.dates.endDate &&
      !isValidProjectDate(value.dates.endDate)
    ) {
      addError(
        errors,
        "dates.endDate",
        "PROJECT_END_DATE_INVALID",
        "Enter a valid Project end date.",
      );
    }

    if (
      value.dates.isCurrent === true &&
      value.dates.endDate
    ) {
      addError(
        errors,
        "dates.endDate",
        "PROJECT_CURRENT_END_DATE_CONFLICT",
        "An ongoing Project cannot have an end date.",
      );
    }

    if (
      value.dates.isCurrent === true &&
      !["in-progress", "maintained"].includes(value.lifecycleStatus)
    ) {
      addError(
        errors,
        "lifecycleStatus",
        "PROJECT_CURRENT_LIFECYCLE_CONFLICT",
        "An ongoing Project must be In Progress or Maintained.",
      );
    }

    if (
      ["completed", "cancelled"].includes(value.lifecycleStatus) &&
      value.dates.isCurrent !== true &&
      !value.dates.endDate
    ) {
      addError(
        errors,
        "dates.endDate",
        "PROJECT_END_DATE_REQUIRED",
        "A completion or cancellation date is required.",
      );
    }

    if (
      isValidProjectDate(value.dates.startDate) &&
      isValidProjectDate(value.dates.endDate)
    ) {
      const start = new Date(
        value.dates.startDate.slice(0, 7) + "-01",
      );

      const end = new Date(
        value.dates.endDate.slice(0, 7) + "-01",
      );

      if (end < start) {
        addError(
          errors,
          "dates.endDate",
          "PROJECT_DATE_ORDER_INVALID",
          "End date cannot be earlier than start date.",
        );
      }
    }
  }

  if (
    !isPlainObject(value.presentation) ||
    typeof value.presentation.isFeatured !== "boolean"
  ) {
    addError(
      errors,
      "presentation.isFeatured",
      "PROJECT_FEATURED_INVALID",
      "Project featured status must be a boolean.",
    );
  }

  if (errors.length > 0) {
    throw createValidationError(errors);
  }

  return structuredClone(value);
}

export function parseProjectRowVersion(value) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9+/]{11}=$/.test(value)
  ) {
    throw createValidationError([
      {
        field: "rowVersion",
        code: "PROJECT_VERSION_INVALID",
        message: "A valid Project version is required.",
      },
    ]);
  }

  return value;
}
