const RESERVED_ROUTES = new Set([
  "api", "admin", "assets", "uploads",
  "static", "public", "auth", "login",
  "logout", "register", "verify",
  "set-password", "reset-password",
  "forgot-password", "dashboard",
  "portfolio", "portfolios", "preview",
  "projects", "experience", "education",
  "training", "skills", "resumes",
  "profile", "certifications", "settings",
  "about", "how-it-works", "opportunities",
  "support", "contact", "privacy", "terms",
  "health", "favicon.ico", "robots.txt",
  "sitemap.xml", "g", "y", "i", "o",
]);

const STYLES = new Set([
  "professional",
  "modern",
  "technical",
  "academic",
]);

const PROVIDERS = new Set(["g", "y", "i", "o"]);

function validSegment(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
      .test(value) &&
    !value.includes("..")
  );
}

export function normalizePublicPortfolioRoute(value) {
  if (typeof value !== "string") {
    return null;
  }

  const route = value.trim().toLowerCase();

  if (!route || route.length > 200) {
    return null;
  }

  const parts = route.split("/");

  if (parts.length === 1) {
    return (
      validSegment(parts[0]) &&
      !RESERVED_ROUTES.has(parts[0])
    ) ? route : null;
  }

  if (parts.length === 2) {
    return (
      PROVIDERS.has(parts[0]) &&
      validSegment(parts[1])
    ) ? route : null;
  }

  return null;
}

export function getPublicPortfolioStyle(value) {
  return STYLES.has(value)
    ? value
    : "professional";
}

export function isSupportedPublicSnapshot(snapshot) {
  return Boolean(
    snapshot &&
    typeof snapshot === "object" &&
    snapshot.schemaVersion === 1 &&
    typeof snapshot.title === "string" &&
    Array.isArray(snapshot.sections) &&
    snapshot.sections.every(section =>
      section &&
      typeof section.sectionKey === "string" &&
      Number.isInteger(section.sortOrder) &&
      typeof section.isVisible === "boolean"
    ) &&
    [
      "projects",
      "experiences",
      "education",
      "skills",
      "certifications",
      "trainings",
    ].every(key =>
      snapshot[key] === undefined ||
      (
        Array.isArray(snapshot[key]) &&
        snapshot[key].every(record =>
          record &&
          typeof record === "object" &&
          !Array.isArray(record)
        )
      )
    )
  );
}