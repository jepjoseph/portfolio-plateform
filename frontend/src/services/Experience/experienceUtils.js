import {
  getEmploymentTypeLabel,
  getExperienceCategoryLabel,
  getExperienceStatusLabel,
  getWorkArrangementLabel,
} from "../../config/experienceConfig.js";

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

function getSearchableText(value) {
  return getText(value).toLocaleLowerCase();
}

/*
 * =========================================
 * Date Parsing
 * =========================================
 */

export function parseExperienceDate(value) {
  const text = getText(value);

  if (!text) {
    return null;
  }

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

  /*
   * Reject impossible complete dates, such as
   * February 31.
   */

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

/*
 * =========================================
 * Date Formatting
 * =========================================
 */

export function formatExperienceDate(
  value,
  { locale = "en-US", includeDay = false, fallback = "" } = {},
) {
  const parsedDate = parseExperienceDate(value);

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

  return new Intl.DateTimeFormat(locale, formatOptions).format(parsedDate.date);
}

/*
 * =========================================
 * Date Range
 * =========================================
 */

export function formatExperienceDateRange(experience, options = {}) {
  const dates = getObject(experience?.dates);

  const startDate = formatExperienceDate(dates.startDate, options);

  const endDate = dates.isCurrent
    ? "Present"
    : formatExperienceDate(dates.endDate, options);

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
 * Duration Calculation
 * =========================================
 */

function getCurrentUtcDateParts() {
  const currentDate = new Date();

  return {
    year: currentDate.getUTCFullYear(),
    month: currentDate.getUTCMonth() + 1,
    day: currentDate.getUTCDate(),
  };
}

export function calculateExperienceDuration(experience) {
  const dates = getObject(experience?.dates);

  const start = parseExperienceDate(dates.startDate);

  if (!start) {
    return null;
  }

  let end;

  if (dates.isCurrent) {
    const current = getCurrentUtcDateParts();

    end = {
      year: current.year,
      month: current.month,
      day: current.day,
      hasDay: true,
    };
  } else {
    end = parseExperienceDate(dates.endDate);
  }

  if (!end) {
    return null;
  }

  let totalMonths = (end.year - start.year) * 12 + (end.month - start.month);

  /*
   * If exact days are supplied and the ending day
   * is earlier than the starting day, the final
   * month has not been completed.
   */

  if (start.hasDay && end.hasDay && end.day < start.day) {
    totalMonths -= 1;
  }

  /*
   * Month-only employment dates represent calendar
   * months. Count the ending month as part of the
   * experience.
   */

  if (!start.hasDay && !end.hasDay) {
    totalMonths += 1;
  }

  totalMonths = Math.max(totalMonths, 0);

  return {
    totalMonths,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

/*
 * =========================================
 * Duration Formatting
 * =========================================
 */

export function formatExperienceDuration(
  experience,
  { compact = false, fallback = "" } = {},
) {
  const duration = calculateExperienceDuration(experience);

  if (!duration) {
    return fallback;
  }

  const { totalMonths, years, months } = duration;

  if (totalMonths === 0) {
    return compact ? "< 1 mo" : "Less than one month";
  }

  const durationParts = [];

  if (years > 0) {
    durationParts.push(
      compact
        ? `${years} yr${years === 1 ? "" : "s"}`
        : `${years} ${years === 1 ? "year" : "years"}`,
    );
  }

  if (months > 0) {
    durationParts.push(
      compact
        ? `${months} mo${months === 1 ? "" : "s"}`
        : `${months} ${months === 1 ? "month" : "months"}`,
    );
  }

  return durationParts.join(" ");
}

/*
 * =========================================
 * Location Formatting
 * =========================================
 */

export function formatExperienceLocation(experience) {
  const location = getObject(experience?.location);

  if (getText(location.displayValue)) {
    return getText(location.displayValue);
  }

  const locationParts = [
    getText(location.city),
    getText(location.stateRegion),
    getText(location.country),
  ].filter(Boolean);

  return locationParts.join(", ");
}

/*
 * =========================================
 * Display Labels
 * =========================================
 */

export function getExperiencePositionTitle(experience) {
  return getText(experience?.position?.title) || "Untitled Position";
}

export function getExperienceOrganizationName(experience) {
  return getText(experience?.organization?.name) || "Organization not provided";
}

export function getExperiencePrimaryLabel(experience) {
  return getExperiencePositionTitle(experience);
}

export function getExperienceSecondaryLabel(experience) {
  const organization = getExperienceOrganizationName(experience);

  const location = formatExperienceLocation(experience);

  return location ? `${organization} · ${location}` : organization;
}

export function getExperienceCategoryDisplay(experience) {
  return getExperienceCategoryLabel(experience?.category) || "Experience";
}

export function getExperienceEmploymentTypeDisplay(experience) {
  return getEmploymentTypeLabel(experience?.position?.employmentType);
}

export function getExperienceWorkArrangementDisplay(experience) {
  return getWorkArrangementLabel(experience?.position?.workArrangement);
}

export function getExperienceStatusDisplay(experience) {
  return getExperienceStatusLabel(experience?.status) || "Active";
}

/*
 * =========================================
 * Metadata Labels
 * =========================================
 */

export function getExperienceMetadata(experience) {
  const values = [
    getExperienceEmploymentTypeDisplay(experience),

    getExperienceWorkArrangementDisplay(experience),

    formatExperienceLocation(experience),
  ].filter(Boolean);

  return values;
}

/*
 * =========================================
 * Record Completeness
 * =========================================
 */

export function getExperienceCompleteness(experience) {
  const checks = [
    {
      id: "position",
      label: "Position title",
      complete: Boolean(getText(experience?.position?.title)),
      weight: 2,
    },
    {
      id: "organization",
      label: "Organization",
      complete: Boolean(getText(experience?.organization?.name)),
      weight: 2,
    },
    {
      id: "dates",
      label: "Employment dates",
      complete: Boolean(
        getText(experience?.dates?.startDate) &&
        (experience?.dates?.isCurrent || getText(experience?.dates?.endDate)),
      ),
      weight: 2,
    },
    {
      id: "overview",
      label: "Experience overview",
      complete: Boolean(getText(experience?.overview)),
      weight: 1,
    },
    {
      id: "responsibilities",
      label: "Responsibilities",
      complete: getArray(experience?.responsibilities).length > 0,
      weight: 1,
    },
    {
      id: "achievements",
      label: "Achievements",
      complete: getArray(experience?.achievements).length > 0,
      weight: 1,
    },
    {
      id: "capabilities",
      label: "Skills or technologies",
      complete:
        getArray(experience?.skills).length > 0 ||
        getArray(experience?.technologies).length > 0,
      weight: 1,
    },
  ];

  const maximumScore = checks.reduce((total, check) => total + check.weight, 0);

  const score = checks.reduce(
    (total, check) => total + (check.complete ? check.weight : 0),
    0,
  );

  const percentage =
    maximumScore > 0 ? Math.round((score / maximumScore) * 100) : 0;

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
 * Searchable Experience Text
 * =========================================
 */

export function createExperienceSearchText(experience) {
  const responsibilities = getArray(experience?.responsibilities).map((item) =>
    getText(item?.text || item),
  );

  const achievements = getArray(experience?.achievements).flatMap((item) => [
    getText(item?.text || item),
    getText(item?.metric),
  ]);

  const skills = getArray(experience?.skills).map((item) =>
    getText(item?.name || item?.label || item?.value || item),
  );

  const technologies = getArray(experience?.technologies).map((item) =>
    getText(item?.name || item?.label || item?.value || item),
  );

  const leadership = getObject(experience?.leadership);

  return [
    getExperiencePositionTitle(experience),

    getExperienceOrganizationName(experience),

    getExperienceCategoryDisplay(experience),

    getExperienceEmploymentTypeDisplay(experience),

    getExperienceWorkArrangementDisplay(experience),

    formatExperienceLocation(experience),

    getText(experience?.organization?.industry),

    getText(experience?.overview),

    getText(leadership.description),

    ...responsibilities,
    ...achievements,
    ...skills,
    ...technologies,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

/*
 * =========================================
 * Search Experiences
 * =========================================
 */

export function searchExperiences(experiences, query) {
  const normalizedQuery = getSearchableText(query);

  if (!normalizedQuery) {
    return [...getArray(experiences)];
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  return getArray(experiences).filter((experience) => {
    const searchableText = createExperienceSearchText(experience);

    return queryTerms.every((term) => searchableText.includes(term));
  });
}

/*
 * =========================================
 * Filter Experiences
 * =========================================
 */

export function filterExperiences(experiences, filters = {}) {
  const {
    category = "all",
    employmentType = "all",
    workArrangement = "all",
    status = "all",
    timeline = "all",
    hasAchievements = false,
    hasSkillsOrTechnologies = false,
  } = filters;

  return getArray(experiences).filter((experience) => {
    if (category !== "all" && experience.category !== category) {
      return false;
    }

    if (
      employmentType !== "all" &&
      experience.position?.employmentType !== employmentType
    ) {
      return false;
    }

    if (
      workArrangement !== "all" &&
      experience.position?.workArrangement !== workArrangement
    ) {
      return false;
    }

    if (status !== "all" && experience.status !== status) {
      return false;
    }

    if (timeline === "current" && experience.dates?.isCurrent !== true) {
      return false;
    }

    if (timeline === "previous" && experience.dates?.isCurrent === true) {
      return false;
    }

    if (hasAchievements && getArray(experience.achievements).length === 0) {
      return false;
    }

    if (
      hasSkillsOrTechnologies &&
      getArray(experience.skills).length === 0 &&
      getArray(experience.technologies).length === 0
    ) {
      return false;
    }

    return true;
  });
}

/*
 * =========================================
 * Sort Date Helpers
 * =========================================
 */

function getDateSortValue(value) {
  const parsedDate = parseExperienceDate(value);

  return parsedDate ? parsedDate.date.getTime() : 0;
}

function compareTextValues(firstValue, secondValue) {
  return getText(firstValue).localeCompare(getText(secondValue), undefined, {
    sensitivity: "base",
  });
}

/*
 * =========================================
 * Sort Experiences
 * =========================================
 */

export function sortExperiences(experiences, sortOption = "newest") {
  const sortedExperiences = [...getArray(experiences)];

  sortedExperiences.sort((firstExperience, secondExperience) => {
    switch (sortOption) {
      case "oldest":
        return (
          getDateSortValue(firstExperience.dates?.startDate) -
          getDateSortValue(secondExperience.dates?.startDate)
        );

      case "position-ascending":
        return compareTextValues(
          getExperiencePositionTitle(firstExperience),
          getExperiencePositionTitle(secondExperience),
        );

      case "position-descending":
        return compareTextValues(
          getExperiencePositionTitle(secondExperience),
          getExperiencePositionTitle(firstExperience),
        );

      case "organization-ascending":
        return compareTextValues(
          getExperienceOrganizationName(firstExperience),
          getExperienceOrganizationName(secondExperience),
        );

      case "organization-descending":
        return compareTextValues(
          getExperienceOrganizationName(secondExperience),
          getExperienceOrganizationName(firstExperience),
        );

      case "recently-updated":
        return (
          new Date(secondExperience.updatedAt || 0).getTime() -
          new Date(firstExperience.updatedAt || 0).getTime()
        );

      case "newest":
      default: {
        /*
         * Current positions appear first.
         */

        const firstIsCurrent = firstExperience.dates?.isCurrent === true;

        const secondIsCurrent = secondExperience.dates?.isCurrent === true;

        if (firstIsCurrent !== secondIsCurrent) {
          return firstIsCurrent ? -1 : 1;
        }

        const firstEndDate = firstIsCurrent
          ? Number.MAX_SAFE_INTEGER
          : getDateSortValue(firstExperience.dates?.endDate);

        const secondEndDate = secondIsCurrent
          ? Number.MAX_SAFE_INTEGER
          : getDateSortValue(secondExperience.dates?.endDate);

        if (firstEndDate !== secondEndDate) {
          return secondEndDate - firstEndDate;
        }

        return (
          getDateSortValue(secondExperience.dates?.startDate) -
          getDateSortValue(firstExperience.dates?.startDate)
        );
      }
    }
  });

  return sortedExperiences;
}

/*
 * =========================================
 * Search, Filter and Sort
 * =========================================
 */

export function prepareExperienceCollection({
  experiences = [],
  query = "",
  filters = {},
  sortOption = "newest",
} = {}) {
  const searchedExperiences = searchExperiences(experiences, query);

  const filteredExperiences = filterExperiences(searchedExperiences, filters);

  return sortExperiences(filteredExperiences, sortOption);
}

/*
 * =========================================
 * Experience Statistics
 * =========================================
 */

export function getExperienceStatistics(experiences) {
  const collection = getArray(experiences);

  const active = collection.filter(
    (experience) => experience.status !== "archived",
  );

  const archived = collection.filter(
    (experience) => experience.status === "archived",
  );

  const current = active.filter(
    (experience) => experience.dates?.isCurrent === true,
  );

  const previous = active.filter(
    (experience) => experience.dates?.isCurrent !== true,
  );

  const withAchievements = active.filter(
    (experience) => getArray(experience.achievements).length > 0,
  );

  return {
    total: collection.length,
    active: active.length,
    archived: archived.length,
    current: current.length,
    previous: previous.length,
    withAchievements: withAchievements.length,
  };
}
