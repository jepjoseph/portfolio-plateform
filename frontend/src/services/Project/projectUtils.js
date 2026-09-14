import {
  getProjectAwardPlacementLabel,
  getProjectCategoryLabel,
  getProjectLifecycleStatusLabel,
  getProjectOwnershipLabel,
  getProjectRecognitionTypeLabel,
  getProjectSkillProficiencyLabel,
} from "../../config/projectConfig.js";

import { createPublicProject } from "../../models/projectModel.js";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function getSearchableText(value) {
  return getText(value).normalize("NFKC").toLocaleLowerCase();
}

/*
 * =========================================
 * Date Parsing
 * =========================================
 */

export function parseProjectDate(value) {
  const normalizedValue = getText(value);

  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(
    /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    match[3] &&
    (parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day)
  ) {
    return null;
  }

  return {
    value: normalizedValue,
    date: parsedDate,
    timestamp: parsedDate.getTime(),
    year,
    month,
    day,
    hasDay: Boolean(match[3]),
  };
}

/*
 * =========================================
 * Date Sort Helpers
 * =========================================
 */

function getDateSortValue(value) {
  return parseProjectDate(value)?.timestamp || 0;
}

function getUpdatedSortValue(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

/*
 * =========================================
 * Media Helpers
 * =========================================
 */

function isUsableMedia(item) {
  return Boolean(
    item &&
    item.status !== "archived" &&
    (getText(item.storageKey) || getText(item.externalUrl)),
  );
}

function isPublicUsableMedia(item) {
  return Boolean(isUsableMedia(item) && item.visibility !== "private");
}

/*
 * =========================================
 * Featured Media
 * =========================================
 */

export function getProjectFeaturedMedia(project) {
  const activeMedia = getArray(project?.media).filter(isUsableMedia);

  return (
    activeMedia.find(
      (item) => item.id === project?.presentation?.featuredMediaId,
    ) ||
    activeMedia.find((item) => item.isFeatured) ||
    activeMedia[0] ||
    null
  );
}

/*
 * =========================================
 * Public Featured Media
 * =========================================
 */

export function getProjectPublicFeaturedMedia(project) {
  const activePublicMedia = getArray(project?.media).filter(
    isPublicUsableMedia,
  );

  return (
    activePublicMedia.find(
      (item) => item.id === project?.presentation?.featuredMediaId,
    ) ||
    activePublicMedia.find((item) => item.isFeatured) ||
    activePublicMedia[0] ||
    null
  );
}

/*
 * =========================================
 * Date Formatting
 * =========================================
 */

export function formatProjectDate(
  value,
  { locale = "en-US", includeDay = false, fallback = "" } = {},
) {
  const parsedDate = parseProjectDate(value);

  if (!parsedDate) {
    return fallback;
  }

  const formatOptions =
    includeDay && parsedDate.hasDay
      ? {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }
      : {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        };

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(
      parsedDate.date,
    );
  } catch {
    return new Intl.DateTimeFormat("en-US", formatOptions).format(
      parsedDate.date,
    );
  }
}

/*
 * =========================================
 * Date Range
 * =========================================
 */

export function getProjectDateRange(project, options = {}) {
  const dates = getObject(project?.dates);

  const startDate = formatProjectDate(dates.startDate, options);

  const endDate = dates.isCurrent
    ? "Present"
    : formatProjectDate(dates.endDate, options);

  if (startDate && endDate) {
    return `${startDate} – ${endDate}`;
  }

  if (startDate) {
    return startDate;
  }

  if (endDate) {
    return endDate;
  }

  return "Dates not provided";
}

/*
 * =========================================
 * Project State Helpers
 * =========================================
 */

export function isProjectCurrent(project) {
  return Boolean(
    project?.dates?.isCurrent ||
    ["in-progress", "maintained"].includes(project?.lifecycleStatus),
  );
}

export function isProjectCompleted(project) {
  return project?.lifecycleStatus === "completed";
}

export function hasProjectMedia(project) {
  return getArray(project?.media).some(isUsableMedia);
}

export function hasPublicProjectMedia(project) {
  return getArray(project?.media).some(isPublicUsableMedia);
}

export function hasProjectAwards(project) {
  return getArray(project?.awards).length > 0;
}

export function hasProjectDocuments(project) {
  return getArray(project?.supportingDocuments).some(
    (document) =>
      document?.status !== "archived" &&
      Boolean(getText(document?.storageKey) || getText(document?.externalUrl)),
  );
}

/*
 * =========================================
 * Relationship Count
 * =========================================
 */

export function getProjectRelationshipCount(project) {
  const relatedRecords = getObject(project?.relatedRecords);

  const relatedRecordCount = [
    relatedRecords.experienceRelationships,
    relatedRecords.educationRelationships,
    relatedRecords.trainingRelationships,
    relatedRecords.certificationRelationships,
  ].reduce((total, relationships) => total + getArray(relationships).length, 0);

  return relatedRecordCount + getArray(project?.skillRelationships).length;
}

/*
 * =========================================
 * Impact Score
 * =========================================
 *
 * This is a deterministic portfolio-evidence
 * score used for sorting. It is not a claim
 * about the project's real-world value.
 */

export function getProjectImpactScore(project) {
  const results = getObject(project?.results);

  const metrics = getArray(results.metrics);

  const awards = getArray(project?.awards);

  const documents = getArray(project?.supportingDocuments).filter(
    (document) => document?.status !== "archived",
  );

  let score = 0;

  if (getText(results.outcome)) {
    score += 4;
  }

  if (getText(results.problemsSolved)) {
    score += 3;
  }

  if (getText(results.impact)) {
    score += 4;
  }

  if (getText(results.beneficiariesAffected)) {
    score += 2;
  }

  score += Math.min(metrics.length, 5) * 3;

  score += Math.min(awards.length, 3) * 4;

  score += Math.min(documents.length, 3);

  if (project?.presentation?.isFeatured) {
    score += 2;
  }

  return score;
}

/*
 * =========================================
 * Searchable Text
 * =========================================
 */

export function createProjectSearchText(project) {
  const organization = getObject(project?.organization);

  const location = getObject(project?.location);

  const problem = getObject(project?.problem);

  const solution = getObject(project?.solution);

  const results = getObject(project?.results);

  const presentation = getObject(project?.presentation);

  const relatedRecords = getObject(project?.relatedRecords);

  const objectives = getArray(problem.objectives).map(
    (item) => item?.text || item,
  );

  const constraints = getArray(problem.constraints).map(
    (item) => item?.text || item,
  );

  const features = getArray(solution.features).map(
    (item) => item?.text || item,
  );

  const contributions = getArray(solution.contributions).map(
    (item) => item?.text || item,
  );

  const metrics = getArray(results.metrics).flatMap((metric) => [
    metric?.label,
    metric?.value,
    metric?.description,
  ]);

  const skills = getArray(project?.skillRelationships).flatMap(
    (relationship) => [
      relationship?.nameSnapshot,
      relationship?.categorySnapshot,
      relationship?.usageDescription,

      getProjectSkillProficiencyLabel(relationship?.demonstratedProficiency),
    ],
  );

  const technologies = getArray(project?.technologies).flatMap((technology) => [
    technology?.name,
    technology?.category,
  ]);

  const relationships = [
    ...getArray(relatedRecords.experienceRelationships),

    ...getArray(relatedRecords.educationRelationships),

    ...getArray(relatedRecords.trainingRelationships),

    ...getArray(relatedRecords.certificationRelationships),
  ].flatMap((relationship) => [
    relationship?.snapshot?.name,
    relationship?.snapshot?.secondaryLabel,
    relationship?.snapshot?.status,
    relationship?.description,
  ]);

  const awards = getArray(project?.awards).flatMap((award) => [
    award?.name,
    award?.organization,

    getProjectRecognitionTypeLabel(award?.recognitionType),

    getProjectAwardPlacementLabel(award?.placement),

    award?.description,
  ]);

  const media = getArray(project?.media).flatMap((mediaItem) => [
    mediaItem?.name,
    mediaItem?.caption,
    mediaItem?.altText,
    mediaItem?.fileName,
  ]);

  const documents = getArray(project?.supportingDocuments).flatMap(
    (document) => [
      document?.name,
      document?.description,
      document?.fileName,
      document?.documentType,
    ],
  );

  return [
    project?.title,
    project?.role,

    organization.name,
    organization.clientName,

    location.displayValue,

    getProjectCategoryLabel(project?.category),

    getProjectLifecycleStatusLabel(project?.lifecycleStatus),

    getProjectOwnershipLabel(project?.ownership),

    problem.statement,
    problem.targetAudience,
    problem.context,
    problem.importance,

    solution.overview,
    solution.approach,
    solution.architecture,

    results.outcome,
    results.problemsSolved,
    results.impact,
    results.beneficiariesAffected,
    results.lessonsLearned,
    results.futureImprovements,

    presentation.shortSummary,
    presentation.caseStudy,

    ...objectives,
    ...constraints,
    ...features,
    ...contributions,
    ...metrics,
    ...skills,
    ...technologies,
    ...relationships,
    ...awards,
    ...media,
    ...documents,
  ]
    .map(getText)
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

/*
 * =========================================
 * Search Projects
 * =========================================
 */

export function searchProjects(projects, query) {
  const normalizedQuery = getSearchableText(query);

  if (!normalizedQuery) {
    return [...getArray(projects)];
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  return getArray(projects).filter((project) => {
    const searchableText = createProjectSearchText(project);

    return queryTerms.every((term) => searchableText.includes(term));
  });
}

/*
 * =========================================
 * Relationship Filter
 * =========================================
 */

function hasRelationshipType(project, relationshipType) {
  switch (relationshipType) {
    case "skill":
      return getArray(project?.skillRelationships).length > 0;

    case "experience":
      return (
        getArray(project?.relatedRecords?.experienceRelationships).length > 0
      );

    case "education":
      return (
        getArray(project?.relatedRecords?.educationRelationships).length > 0
      );

    case "training":
      return (
        getArray(project?.relatedRecords?.trainingRelationships).length > 0
      );

    case "certification":
      return (
        getArray(project?.relatedRecords?.certificationRelationships).length > 0
      );

    default:
      return true;
  }
}

/*
 * =========================================
 * Filter Projects
 * =========================================
 */

export function filterProjects(projects, filters = {}) {
  const {
    category = "all",
    lifecycleStatus = "all",
    ownership = "all",
    featured = "all",
    media = "all",
    awarded = "all",
    relationship = "all",
  } = filters;

  return getArray(projects).filter((project) => {
    if (category !== "all" && project.category !== category) {
      return false;
    }

    if (
      lifecycleStatus !== "all" &&
      project.lifecycleStatus !== lifecycleStatus
    ) {
      return false;
    }

    if (ownership !== "all" && project.ownership !== ownership) {
      return false;
    }

    if (featured === "featured" && !project.presentation?.isFeatured) {
      return false;
    }

    if (featured === "not-featured" && project.presentation?.isFeatured) {
      return false;
    }

    const projectHasMedia = hasProjectMedia(project);

    if (media === "with-media" && !projectHasMedia) {
      return false;
    }

    if (media === "without-media" && projectHasMedia) {
      return false;
    }

    const projectHasAwards = hasProjectAwards(project);

    if (awarded === "awarded" && !projectHasAwards) {
      return false;
    }

    if (awarded === "not-awarded" && projectHasAwards) {
      return false;
    }

    if (relationship !== "all" && !hasRelationshipType(project, relationship)) {
      return false;
    }

    return true;
  });
}

/*
 * =========================================
 * Title Comparison
 * =========================================
 */

function compareProjectTitles(firstProject, secondProject) {
  return getText(firstProject?.title).localeCompare(
    getText(secondProject?.title),
    undefined,
    {
      sensitivity: "base",
    },
  );
}

/*
 * =========================================
 * Updated-Date Comparison
 * =========================================
 */

function compareRecentlyUpdated(firstProject, secondProject) {
  const difference =
    getUpdatedSortValue(secondProject?.updatedAt) -
    getUpdatedSortValue(firstProject?.updatedAt);

  if (difference !== 0) {
    return difference;
  }

  return compareProjectTitles(firstProject, secondProject);
}

/*
 * =========================================
 * Newest Start-Date Comparison
 * =========================================
 *
 * Projects without a start date are placed
 * at the bottom of the collection.
 */

function compareNewestStarted(firstProject, secondProject) {
  const firstStartDate = getDateSortValue(firstProject?.dates?.startDate);

  const secondStartDate = getDateSortValue(secondProject?.dates?.startDate);

  if (firstStartDate && !secondStartDate) {
    return -1;
  }

  if (!firstStartDate && secondStartDate) {
    return 1;
  }

  if (firstStartDate !== secondStartDate) {
    return secondStartDate - firstStartDate;
  }

  return compareRecentlyUpdated(firstProject, secondProject);
}

/*
 * =========================================
 * Oldest Start-Date Comparison
 * =========================================
 *
 * Projects without a start date remain at
 * the bottom even when sorting oldest-first.
 */

function compareOldestStarted(firstProject, secondProject) {
  const firstStartDate = getDateSortValue(firstProject?.dates?.startDate);

  const secondStartDate = getDateSortValue(secondProject?.dates?.startDate);

  if (firstStartDate && !secondStartDate) {
    return -1;
  }

  if (!firstStartDate && secondStartDate) {
    return 1;
  }

  if (firstStartDate !== secondStartDate) {
    return firstStartDate - secondStartDate;
  }

  return compareProjectTitles(firstProject, secondProject);
}

/*
 * =========================================
 * Portfolio Priority
 * =========================================
 */

function getPortfolioPriority(project) {
  if (project?.presentation?.isFeatured) {
    return 1;
  }

  if (isProjectCurrent(project)) {
    return 2;
  }

  if (
    isProjectCompleted(project) &&
    (project?.dates?.endDate || project?.dates?.startDate)
  ) {
    return 3;
  }

  if (project?.dates?.endDate || project?.dates?.startDate) {
    return 4;
  }

  return 5;
}

/*
 * =========================================
 * Portfolio Priority Comparison
 * =========================================
 */

function comparePortfolioPriority(firstProject, secondProject) {
  const firstPriority = getPortfolioPriority(firstProject);

  const secondPriority = getPortfolioPriority(secondProject);

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  const currentDifference =
    Number(isProjectCurrent(secondProject)) -
    Number(isProjectCurrent(firstProject));

  if (currentDifference !== 0) {
    return currentDifference;
  }

  const firstRelevantDate = getDateSortValue(
    firstProject?.dates?.isCurrent
      ? firstProject?.dates?.startDate
      : firstProject?.dates?.endDate || firstProject?.dates?.startDate,
  );

  const secondRelevantDate = getDateSortValue(
    secondProject?.dates?.isCurrent
      ? secondProject?.dates?.startDate
      : secondProject?.dates?.endDate || secondProject?.dates?.startDate,
  );

  if (firstRelevantDate !== secondRelevantDate) {
    return secondRelevantDate - firstRelevantDate;
  }

  return compareRecentlyUpdated(firstProject, secondProject);
}

/*
 * =========================================
 * Newest Completed Comparison
 * =========================================
 */

function compareNewestCompleted(firstProject, secondProject) {
  const firstCompleted = isProjectCompleted(firstProject);

  const secondCompleted = isProjectCompleted(secondProject);

  if (firstCompleted !== secondCompleted) {
    return Number(secondCompleted) - Number(firstCompleted);
  }

  const firstDate = getDateSortValue(
    firstProject?.dates?.endDate || firstProject?.dates?.startDate,
  );

  const secondDate = getDateSortValue(
    secondProject?.dates?.endDate || secondProject?.dates?.startDate,
  );

  if (firstDate && !secondDate) {
    return -1;
  }

  if (!firstDate && secondDate) {
    return 1;
  }

  if (firstDate !== secondDate) {
    return secondDate - firstDate;
  }

  return compareProjectTitles(firstProject, secondProject);
}

/*
 * =========================================
 * Sort Projects
 * =========================================
 */

export function sortProjects(projects, sortOption = "newest-started") {
  const sortedProjects = [...getArray(projects)];

  sortedProjects.sort((firstProject, secondProject) => {
    switch (sortOption) {
      case "newest-started":
        return compareNewestStarted(firstProject, secondProject);

      case "oldest":
        return compareOldestStarted(firstProject, secondProject);

      case "title-ascending":
        return compareProjectTitles(firstProject, secondProject);

      case "title-descending":
        return compareProjectTitles(secondProject, firstProject);

      case "recently-updated":
        return compareRecentlyUpdated(firstProject, secondProject);

      case "newest-completed":
        return compareNewestCompleted(firstProject, secondProject);

      case "impact":
        return (
          getProjectImpactScore(secondProject) -
            getProjectImpactScore(firstProject) ||
          compareNewestStarted(firstProject, secondProject)
        );

      case "portfolio-default":
        return comparePortfolioPriority(firstProject, secondProject);

      default:
        return compareNewestStarted(firstProject, secondProject);
    }
  });

  return sortedProjects;
}

/*
 * =========================================
 * Search, Filter, and Sort
 * =========================================
 */

export function prepareProjectCollection({
  projects = [],
  query = "",
  filters = {},
  sortOption = "newest-started",
} = {}) {
  const searchedProjects = searchProjects(projects, query);

  const filteredProjects = filterProjects(searchedProjects, filters);

  return sortProjects(filteredProjects, sortOption);
}

/*
 * =========================================
 * Project Statistics
 * =========================================
 */

export function getProjectStatistics(projects) {
  const collection = getArray(projects);

  const active = collection.filter(
    (project) => project.recordStatus !== "archived",
  );

  const archived = collection.filter(
    (project) => project.recordStatus === "archived",
  );

  return {
    total: collection.length,

    active: active.length,

    archived: archived.length,

    featured: active.filter((project) => project.presentation?.isFeatured)
      .length,

    current: active.filter(isProjectCurrent).length,

    completed: active.filter(isProjectCompleted).length,

    awarded: active.filter(hasProjectAwards).length,

    withMedia: active.filter(hasProjectMedia).length,

    withPublicMedia: active.filter(hasPublicProjectMedia).length,

    withDocuments: active.filter(hasProjectDocuments).length,

    withRelationships: active.filter(
      (project) => getProjectRelationshipCount(project) > 0,
    ).length,
  };
}

/*
 * =========================================
 * Public Transformation Export
 * =========================================
 */

export { createPublicProject };
