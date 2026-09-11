import {
  getEducationCredentialTypeLabel,
  getEducationInstitutionTypeLabel,
  getEducationSourceLabel,
  getEducationStatusLabel,
} from "../../config/educationConfig.js";

/*
 * =========================================
 * Basic Helpers
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

/*
 * =========================================
 * Active and Archived
 * =========================================
 */

export function isActiveEducation(education) {
  return education?.status !== "archived";
}

export function isArchivedEducation(education) {
  return education?.status === "archived";
}

export function getActiveEducation(educationRecords = []) {
  return getArray(educationRecords).filter(isActiveEducation);
}

export function getArchivedEducation(educationRecords = []) {
  return getArray(educationRecords).filter(isArchivedEducation);
}

/*
 * =========================================
 * Display Labels
 * =========================================
 */

export function getEducationInstitutionName(education) {
  return getText(education?.institution?.name) || "Institution not provided";
}

export function getEducationCredentialName(education) {
  return getText(education?.credential?.name) || "Unnamed Credential";
}

export function getEducationPrimaryLabel(education) {
  return getEducationCredentialName(education);
}

export function getEducationSecondaryLabel(education) {
  const institution = getEducationInstitutionName(education);

  const fieldOfStudy = getText(education?.credential?.fieldOfStudy);

  return fieldOfStudy ? `${institution} · ${fieldOfStudy}` : institution;
}

export function getEducationCredentialTypeDisplay(education) {
  return getEducationCredentialTypeLabel(education?.credential?.type);
}

export function getEducationInstitutionTypeDisplay(education) {
  return getEducationInstitutionTypeLabel(education?.institution?.type);
}

export function getEducationSourceDisplay(education) {
  return getEducationSourceLabel(education?.source);
}

export function getEducationStatusDisplay(education) {
  return getEducationStatusLabel(education?.status);
}

/*
 * =========================================
 * Date Parsing and Formatting
 * =========================================
 */

export function parseEducationDate(value) {
  const text = getText(value);

  const match = text.match(
    /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    match[3] &&
    (date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day)
  ) {
    return null;
  }

  return {
    value: text,
    date,
    year,
    month,
    day,
    hasDay: Boolean(match[3]),
  };
}

export function formatEducationDate(
  value,
  { locale = "en-US", includeDay = false, fallback = "" } = {},
) {
  const parsed = parseEducationDate(value);

  if (!parsed) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    locale,
    includeDay && parsed.hasDay
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
        },
  ).format(parsed.date);
}

export function formatEducationDateRange(education, options = {}) {
  const dates = getObject(education?.dates);

  const startDate = formatEducationDate(dates.startDate, options);

  const endDate = dates.isCurrent
    ? "Present"
    : formatEducationDate(dates.endDate, options);

  if (startDate && endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate || endDate || "Dates not provided";
}

/*
 * =========================================
 * Location and GPA
 * =========================================
 */

export function formatEducationLocation(education) {
  const location = getObject(education?.location);

  if (getText(location.displayValue)) {
    return getText(location.displayValue);
  }

  return [
    getText(location.city),
    getText(location.stateRegion),
    getText(location.country),
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatEducationGpa(education, { fallback = "" } = {}) {
  const gpa = education?.academic?.gpa;

  const maximum = education?.academic?.maximumGpa;

  if (gpa === null || gpa === undefined || gpa === "") {
    return fallback;
  }

  if (maximum !== null && maximum !== undefined && maximum !== "") {
    return `${gpa}/${maximum}`;
  }

  return String(gpa);
}

/*
 * =========================================
 * Search
 * =========================================
 */

export function createEducationSearchText(education) {
  const honors = getArray(education?.academic?.honors).flatMap((honor) => [
    honor?.name || honor,
    honor?.description,
  ]);

  const coursework = getArray(education?.coursework).flatMap((course) => [
    course?.name || course,
    course?.description,
  ]);

  const activities = getArray(education?.activities).flatMap((activity) => [
    activity?.name || activity,
    activity?.description,
  ]);

  const skills = getArray(education?.skillRelationships).map(
    (relationship) => relationship?.nameSnapshot || relationship?.name,
  );

  return [
    getEducationCredentialName(education),

    getEducationInstitutionName(education),

    getEducationCredentialTypeDisplay(education),

    getEducationInstitutionTypeDisplay(education),

    education?.credential?.fieldOfStudy,

    education?.credential?.minor,

    education?.description,

    formatEducationLocation(education),

    ...honors,
    ...coursework,
    ...activities,
    ...skills,
  ]
    .map(getText)
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

export function searchEducation(educationRecords = [], query = "") {
  const normalizedQuery = getText(query).normalize("NFKC").toLocaleLowerCase();

  if (!normalizedQuery) {
    return [...getArray(educationRecords)];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return getArray(educationRecords).filter((education) => {
    const searchableText = createEducationSearchText(education);

    return terms.every((term) => searchableText.includes(term));
  });
}

/*
 * =========================================
 * Filtering
 * =========================================
 */

export function filterEducation(educationRecords = [], filters = {}) {
  const {
    credentialType = "all",
    institutionType = "all",
    status = "all",
    timeline = "all",
    hasHonors = false,
    hasSkills = false,
  } = filters;

  return getArray(educationRecords).filter((education) => {
    if (
      credentialType !== "all" &&
      education?.credential?.type !== credentialType
    ) {
      return false;
    }

    if (
      institutionType !== "all" &&
      education?.institution?.type !== institutionType
    ) {
      return false;
    }

    if (status !== "all" && education?.status !== status) {
      return false;
    }

    if (timeline === "current" && education?.dates?.isCurrent !== true) {
      return false;
    }

    if (timeline === "completed" && education?.dates?.isCurrent === true) {
      return false;
    }

    if (hasHonors && getArray(education?.academic?.honors).length === 0) {
      return false;
    }

    if (hasSkills && getArray(education?.skillRelationships).length === 0) {
      return false;
    }

    return true;
  });
}

/*
 * =========================================
 * Sorting
 * =========================================
 */

function compareText(firstValue, secondValue) {
  return getText(firstValue).localeCompare(getText(secondValue), undefined, {
    sensitivity: "base",
  });
}

function getDateSortValue(value) {
  const parsed = parseEducationDate(value);

  return parsed ? parsed.date.getTime() : 0;
}

export function sortEducation(educationRecords = [], sortOption = "newest") {
  const sorted = [...getArray(educationRecords)];

  sorted.sort((first, second) => {
    switch (sortOption) {
      case "oldest":
        return (
          getDateSortValue(first?.dates?.startDate) -
          getDateSortValue(second?.dates?.startDate)
        );

      case "credential-ascending":
        return compareText(
          getEducationCredentialName(first),
          getEducationCredentialName(second),
        );

      case "institution-ascending":
        return compareText(
          getEducationInstitutionName(first),
          getEducationInstitutionName(second),
        );

      case "recently-updated":
        return (
          new Date(second?.updatedAt || 0).getTime() -
          new Date(first?.updatedAt || 0).getTime()
        );

      case "newest":
      default: {
        const firstCurrent = first?.dates?.isCurrent === true;

        const secondCurrent = second?.dates?.isCurrent === true;

        if (firstCurrent !== secondCurrent) {
          return firstCurrent ? -1 : 1;
        }

        const firstEnd = firstCurrent
          ? Number.MAX_SAFE_INTEGER
          : getDateSortValue(first?.dates?.endDate);

        const secondEnd = secondCurrent
          ? Number.MAX_SAFE_INTEGER
          : getDateSortValue(second?.dates?.endDate);

        return (
          secondEnd - firstEnd ||
          getDateSortValue(second?.dates?.startDate) -
            getDateSortValue(first?.dates?.startDate)
        );
      }
    }
  });

  return sorted;
}

export function prepareEducationCollection({
  educationRecords = [],
  query = "",
  filters = {},
  sortOption = "newest",
} = {}) {
  return sortEducation(
    filterEducation(searchEducation(educationRecords, query), filters),
    sortOption,
  );
}

/*
 * =========================================
 * Completeness
 * =========================================
 */

export function getEducationCompleteness(education) {
  const checks = [
    {
      id: "institution",
      label: "Institution",
      complete: Boolean(getText(education?.institution?.name)),
      weight: 2,
    },
    {
      id: "credential",
      label: "Credential",
      complete: Boolean(
        getText(education?.credential?.name) &&
        getText(education?.credential?.type),
      ),
      weight: 2,
    },
    {
      id: "dates",
      label: "Education dates",
      complete: Boolean(
        getText(education?.dates?.startDate) &&
        (education?.dates?.isCurrent || getText(education?.dates?.endDate)),
      ),
      weight: 2,
    },
    {
      id: "field",
      label: "Field of study",
      complete: Boolean(getText(education?.credential?.fieldOfStudy)),
      weight: 1,
    },
    {
      id: "description",
      label: "Description",
      complete: Boolean(getText(education?.description)),
      weight: 1,
    },
    {
      id: "details",
      label: "Academic details",
      complete:
        getArray(education?.academic?.honors).length > 0 ||
        getArray(education?.coursework).length > 0 ||
        getArray(education?.activities).length > 0,
      weight: 1,
    },
    {
      id: "skills",
      label: "Related skills",
      complete: getArray(education?.skillRelationships).length > 0,
      weight: 1,
    },
  ];

  const maximumScore = checks.reduce((total, check) => total + check.weight, 0);

  const score = checks.reduce(
    (total, check) => total + (check.complete ? check.weight : 0),
    0,
  );

  const percentage = Math.round((score / maximumScore) * 100);

  let level = "basic";
  let label = "Basic";

  if (percentage >= 90) {
    level = "excellent";
    label = "Excellent";
  } else if (percentage >= 70) {
    level = "strong";
    label = "Strong";
  } else if (percentage >= 50) {
    level = "developing";
    label = "Developing";
  }

  return {
    score,
    maximumScore,
    percentage,
    level,
    label,
    checks,

    completedChecks: checks.filter((check) => check.complete),

    missingChecks: checks.filter((check) => !check.complete),
  };
}

/*
 * =========================================
 * Statistics
 * =========================================
 */

export function getEducationStatistics(educationRecords = []) {
  const collection = getArray(educationRecords);

  const active = getActiveEducation(collection);

  const archived = getArchivedEducation(collection);

  const current = active.filter(
    (education) => education?.dates?.isCurrent === true,
  );

  const completed = active.filter(
    (education) => education?.dates?.isCurrent !== true,
  );

  const withHonors = active.filter(
    (education) => getArray(education?.academic?.honors).length > 0,
  );

  const withSkills = active.filter(
    (education) => getArray(education?.skillRelationships).length > 0,
  );

  return {
    total: collection.length,
    active: active.length,
    archived: archived.length,
    current: current.length,
    completed: completed.length,
    withHonors: withHonors.length,
    withSkills: withSkills.length,
  };
}

/*
 * =========================================
 * Education Statistics
 * =========================================
 */
/*
export function getEducationStatistics(
  educationRecords = [],
) {
  const collection = getArray(
    educationRecords,
  );

  const active = collection.filter(
    (education) =>
      education.status !== "archived",
  );

  const archived = collection.filter(
    (education) =>
      education.status === "archived",
  );

  const current = active.filter(
    (education) =>
      education.dates?.isCurrent === true,
  );

  const completed = active.filter(
    (education) =>
      education.dates?.isCurrent !== true,
  );

  const withHonors = active.filter(
    (education) =>
      getArray(
        education.academic?.honors,
      ).length > 0,
  );

  const withSkills = active.filter(
    (education) =>
      getArray(
        education.skillRelationships,
      ).length > 0,
  );

  return {
    total: collection.length,
    active: active.length,
    archived: archived.length,
    current: current.length,
    completed: completed.length,
    withHonors: withHonors.length,
    withSkills: withSkills.length,
  };
}*/
