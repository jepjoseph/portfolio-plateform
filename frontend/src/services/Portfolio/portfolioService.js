import { createPublicProject } from "../../models/projectModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

export const PUBLIC_PORTFOLIO_STORAGE_PREFIX = "public-portfolio";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function hasOwn(object, fieldName) {
  return Object.prototype.hasOwnProperty.call(object, fieldName);
}

/*
 * =========================================
 * Portfolio Service Error
 * =========================================
 */

function createPortfolioServiceError(code, message, publicMessage) {
  const error = new Error(message);

  error.name = "PortfolioServiceError";
  error.code = code;
  error.publicMessage = publicMessage;

  return error;
}

/*
 * =========================================
 * Browser Storage
 * =========================================
 */

function requireLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw createPortfolioServiceError(
      "PORTFOLIO_STORAGE_UNAVAILABLE",
      "Browser localStorage is unavailable.",
      "Portfolio storage is not available in this browser.",
    );
  }

  return window.localStorage;
}

/*
 * =========================================
 * Storage Key
 * =========================================
 */

export function createPortfolioStorageKey(username, portfolioSlug) {
  const normalizedUsername = getText(username);

  const normalizedSlug = getText(portfolioSlug);

  if (!normalizedUsername || !normalizedSlug) {
    throw createPortfolioServiceError(
      "PORTFOLIO_IDENTITY_REQUIRED",
      "The portfolio username and slug are required.",
      "The portfolio username and slug are required.",
    );
  }

  return [
    PUBLIC_PORTFOLIO_STORAGE_PREFIX,
    normalizedUsername,
    normalizedSlug,
  ].join(":");
}

/*
 * =========================================
 * Public Project Normalization
 * =========================================
 */

function createSafePublicProject(project) {
  const source = getObject(project);

  if (!source.id) {
    return null;
  }

  /*
   * A complete internal Project contains a
   * visibility object, privateInformation, or
   * recordStatus. createPublicProject applies
   * all configured privacy rules directly.
   */

  const isInternalProject =
    hasOwn(source, "visibility") ||
    hasOwn(source, "privateInformation") ||
    hasOwn(source, "recordStatus");

  if (isInternalProject) {
    return createPublicProject(source);
  }

  /*
   * Portfolio.jsx already creates public-safe
   * Project snapshots. Public media and public
   * documents no longer contain their internal
   * visibility/status fields.
   *
   * Restore those public classifications before
   * normalizing the snapshot again. This prevents
   * valid public documents from being interpreted
   * as private by the Project model defaults.
   */

  return createPublicProject({
    ...source,

    media: getArray(source.media).map((mediaItem) => ({
      ...getObject(mediaItem),
      visibility: "public",
      status: "active",
    })),

    supportingDocuments: getArray(source.supportingDocuments).map(
      (documentRecord) => ({
        ...getObject(documentRecord),
        visibility: "public",
        status: "active",
      }),
    ),

    visibility: {
      showOrganization: source.organization !== null,
      showLocation: source.location !== null,
      showDates: source.dates !== null,
      showLinks: source.links !== null,
      showProblem: source.problem !== null,
      showSolution: source.solution !== null,
      showResults: source.results !== null,
      showSkills: Array.isArray(source.skillRelationships),
      showTechnologies: Array.isArray(source.technologies),
      showRelatedRecords: source.relatedRecords !== null,
      showAwards: Array.isArray(source.awards),
      showMedia: Array.isArray(source.media),
      showSupportingDocuments: Array.isArray(source.supportingDocuments),
    },
  });
}

/*
 * =========================================
 * Public Project Collection
 * =========================================
 */

function createSafePublicProjects(projects) {
  const seenProjectIds = new Set();

  return getArray(projects).reduce((collection, project) => {
    const publicProject = createSafePublicProject(project);

    if (!publicProject?.id || seenProjectIds.has(publicProject.id)) {
      return collection;
    }

    seenProjectIds.add(publicProject.id);

    collection.push(publicProject);

    return collection;
  }, []);
}

/*
 * =========================================
 * Public Portfolio Normalization
 * =========================================
 */

function createPublicPortfolioRecord(portfolio) {
  const source = getObject(portfolio);

  const username = getText(source.username);

  const slug = getText(source.slug);

  if (!username || !slug) {
    throw createPortfolioServiceError(
      "PORTFOLIO_IDENTITY_REQUIRED",
      "The portfolio username and slug are required.",
      "The portfolio username and slug are required.",
    );
  }

  /*
   * Only fields used by the public PortfolioView
   * are included. Editor-only information such as
   * profileSelections is not stored publicly.
   */

  return {
    id: getText(source.id),

    username,

    slug,

    portfolioName: getText(source.portfolioName) || "Professional Portfolio",

    heroSettings: getObject(source.heroSettings),

    selectedProfile: getObject(source.selectedProfile),

    about:
      typeof source.about === "string" ? source.about : getObject(source.about),

    summary: getText(source.summary),

    experiences: getArray(source.experiences),

    education: getArray(source.education),

    skills: getArray(source.skills),

    certifications: getArray(source.certifications),

    trainings: getArray(source.trainings),

    projects: createSafePublicProjects(source.projects),

    featuredResume: source.featuredResume
      ? getObject(source.featuredResume)
      : null,

    sectionVisibility: getObject(source.sectionVisibility),

    isPublished: true,

    updatedAt: new Date().toISOString(),
  };
}

/*
 * =========================================
 * Validate Stored Portfolio
 * =========================================
 */

function validateStoredPortfolio(value, username, portfolioSlug) {
  const portfolio = getObject(value);

  if (
    !portfolio.username ||
    !portfolio.slug ||
    portfolio.username !== username ||
    portfolio.slug !== portfolioSlug
  ) {
    throw createPortfolioServiceError(
      "PORTFOLIO_STORAGE_INVALID",
      "The stored portfolio identity is invalid.",
      "The requested portfolio contains invalid stored data.",
    );
  }

  if (portfolio.isPublished !== true) {
    throw createPortfolioServiceError(
      "PORTFOLIO_NOT_PUBLISHED",
      "The requested portfolio is not published.",
      "This portfolio is not currently published.",
    );
  }

  return portfolio;
}

/*
 * =========================================
 * Save Public Portfolio
 * =========================================
 */

export async function savePortfolio(portfolio) {
  const storage = requireLocalStorage();

  const portfolioToSave = createPublicPortfolioRecord(portfolio);

  const storageKey = createPortfolioStorageKey(
    portfolioToSave.username,
    portfolioToSave.slug,
  );

  try {
    storage.setItem(storageKey, JSON.stringify(portfolioToSave));
  } catch (error) {
    throw createPortfolioServiceError(
      "PORTFOLIO_SAVE_FAILED",
      error?.message || "The public portfolio could not be stored.",
      "The portfolio could not be published in this browser.",
    );
  }

  return portfolioToSave;
}

/*
 * =========================================
 * Get Public Portfolio
 * =========================================
 */

export async function getPublicPortfolio(username, portfolioSlug) {
  const storage = requireLocalStorage();

  const normalizedUsername = getText(username);

  const normalizedSlug = getText(portfolioSlug);

  const storageKey = createPortfolioStorageKey(
    normalizedUsername,
    normalizedSlug,
  );

  let storedPortfolio = "";

  try {
    storedPortfolio = storage.getItem(storageKey) || "";
  } catch (error) {
    throw createPortfolioServiceError(
      "PORTFOLIO_READ_FAILED",
      error?.message || "The public portfolio could not be read.",
      "The portfolio could not be loaded from this browser.",
    );
  }

  if (!storedPortfolio) {
    throw createPortfolioServiceError(
      "PORTFOLIO_NOT_FOUND",
      `Portfolio not found: ${normalizedUsername}/${normalizedSlug}`,
      "The requested portfolio could not be found.",
    );
  }

  let parsedPortfolio;

  try {
    parsedPortfolio = JSON.parse(storedPortfolio);
  } catch {
    throw createPortfolioServiceError(
      "PORTFOLIO_STORAGE_INVALID",
      "The stored public portfolio contains invalid JSON.",
      "The requested portfolio contains invalid stored data.",
    );
  }

  return validateStoredPortfolio(
    parsedPortfolio,
    normalizedUsername,
    normalizedSlug,
  );
}
