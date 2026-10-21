
const SERVER_OWNED_PROJECT_FIELDS = [
  "userId",
  "user_id",
  "createdAt",
  "updatedAt",
  "rowVersion",
];

export function prepareProjectApiPayload(project) {
  if (
    !project ||
    typeof project !== "object" ||
    Array.isArray(project)
  ) {
    throw new TypeError("A valid Project object is required.");
  }

  const payload = structuredClone(project);

  for (const field of SERVER_OWNED_PROJECT_FIELDS) {
    delete payload[field];
  }

  return payload;
}

export function getProjectRowVersion(project) {
  const rowVersion = project?.rowVersion;

  if (
    typeof rowVersion !== "string" ||
    !/^[A-Za-z0-9+/]{11}=$/.test(rowVersion)
  ) {
    throw new TypeError(
      "A valid Project rowVersion is required.",
    );
  }

  return rowVersion;
}
