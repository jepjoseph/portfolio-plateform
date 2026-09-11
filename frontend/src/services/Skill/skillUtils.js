import {
  getLanguageProficiencyLabel,
  getSkillCategoryLabel,
  getSkillProficiencyLabel,
  getSkillSourceLabel,
  getSkillStatusLabel,
  getSkillTypeLabel,
} from "../../config/skillConfig.js";

import {
  getSkillDisplayName,
  normalizeSkillNameForComparison,
} from "../../models/skillModel.js";

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

function getNumericValue(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

/*
 * =========================================
 * Active and Archived Skills
 * =========================================
 */

export function isActiveSkill(skill) {
  return skill?.status !== "archived";
}

export function isArchivedSkill(skill) {
  return skill?.status === "archived";
}

export function getActiveSkills(skills = []) {
  return getArray(skills).filter(isActiveSkill);
}

export function getArchivedSkills(skills = []) {
  return getArray(skills).filter(isArchivedSkill);
}

/*
 * =========================================
 * Skill Display Information
 * =========================================
 */

export function getSkillPrimaryLabel(skill) {
  return getSkillDisplayName(skill);
}

export function getSkillSecondaryLabel(skill) {
  return [
    getSkillCategoryLabel(skill?.category),
    getSkillTypeLabel(skill?.type),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function getSkillCategoryDisplay(skill) {
  return getSkillCategoryLabel(skill?.category);
}

export function getSkillTypeDisplay(skill) {
  return getSkillTypeLabel(skill?.type);
}

export function getSkillProficiencyDisplay(skill) {
  if (skill?.type === "language") {
    return getLanguageProficiencyLabel(skill?.language?.proficiency);
  }

  return getSkillProficiencyLabel(skill?.proficiency?.level);
}

export function getSkillSourceDisplay(skill) {
  return getSkillSourceLabel(skill?.source);
}

export function getSkillStatusDisplay(skill) {
  return getSkillStatusLabel(skill?.status);
}

/*
 * =========================================
 * Skill Metadata
 * =========================================
 */

export function getSkillMetadata(skill) {
  const metadata = [getSkillCategoryDisplay(skill), getSkillTypeDisplay(skill)];

  if (skill?.type === "language" || getText(skill?.proficiency?.level)) {
    metadata.push(getSkillProficiencyDisplay(skill));
  }

  const years = getNumericValue(skill?.proficiency?.yearsOfExperience, -1);

  if (years >= 0) {
    metadata.push(`${years} ${years === 1 ? "year" : "years"}`);
  }

  return metadata.filter(Boolean);
}

/*
 * =========================================
 * Last Used Date
 * =========================================
 */

export function formatSkillLastUsedDate(
  value,
  { locale = "en-US", fallback = "" } = {},
) {
  const normalizedValue = getText(value);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(normalizedValue)) {
    return fallback;
  }

  const [year, month] = normalizedValue.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/*
 * =========================================
 * Search
 * =========================================
 */

export function createSkillSearchText(skill) {
  return [
    skill?.name,
    skill?.description,
    skill?.category,
    skill?.type,
    skill?.source,
    skill?.sourceContext,
    skill?.notes,
    skill?.proficiency?.level,
    skill?.language?.proficiency,
    getSkillCategoryDisplay(skill),
    getSkillTypeDisplay(skill),
    getSkillProficiencyDisplay(skill),
    ...getArray(skill?.aliases),
  ]
    .map(getText)
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

export function searchSkills(skills = [], query = "") {
  const normalizedQuery = normalizeSkillNameForComparison(query);

  if (!normalizedQuery) {
    return [...getArray(skills)];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return getArray(skills).filter((skill) => {
    const searchableText = createSkillSearchText(skill);

    return terms.every((term) => searchableText.includes(term));
  });
}

/*
 * =========================================
 * Filtering
 * =========================================
 */

export function filterSkills(skills = [], filters = {}) {
  const {
    category = "all",
    type = "all",
    proficiency = "all",
    source = "all",
    status = "all",
  } = filters;

  return getArray(skills).filter((skill) => {
    if (category !== "all" && skill?.category !== category) {
      return false;
    }

    if (type !== "all" && skill?.type !== type) {
      return false;
    }

    if (proficiency !== "all" && skill?.proficiency?.level !== proficiency) {
      return false;
    }

    if (source !== "all" && skill?.source !== source) {
      return false;
    }

    if (status !== "all" && skill?.status !== status) {
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

function getUpdatedTime(skill) {
  const timestamp = new Date(skill?.updatedAt || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getCreatedTime(skill) {
  const timestamp = new Date(skill?.createdAt || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortSkills(skills = [], sortOption = "name-ascending") {
  const sortedSkills = [...getArray(skills)];

  sortedSkills.sort((firstSkill, secondSkill) => {
    switch (sortOption) {
      case "name-descending":
        return compareText(secondSkill?.name, firstSkill?.name);

      case "category-ascending":
        return (
          compareText(
            getSkillCategoryDisplay(firstSkill),
            getSkillCategoryDisplay(secondSkill),
          ) || compareText(firstSkill?.name, secondSkill?.name)
        );

      case "type-ascending":
        return (
          compareText(
            getSkillTypeDisplay(firstSkill),
            getSkillTypeDisplay(secondSkill),
          ) || compareText(firstSkill?.name, secondSkill?.name)
        );

      case "proficiency-descending": {
        const proficiencyOrder = {
          expert: 4,
          advanced: 3,
          intermediate: 2,
          foundational: 1,
          "": 0,
        };

        const firstLevel =
          proficiencyOrder[firstSkill?.proficiency?.level || ""] || 0;

        const secondLevel =
          proficiencyOrder[secondSkill?.proficiency?.level || ""] || 0;

        return (
          secondLevel - firstLevel ||
          compareText(firstSkill?.name, secondSkill?.name)
        );
      }

      case "years-descending":
        return (
          getNumericValue(secondSkill?.proficiency?.yearsOfExperience) -
            getNumericValue(firstSkill?.proficiency?.yearsOfExperience) ||
          compareText(firstSkill?.name, secondSkill?.name)
        );

      case "recently-created":
        return getCreatedTime(secondSkill) - getCreatedTime(firstSkill);

      case "recently-updated":
        return getUpdatedTime(secondSkill) - getUpdatedTime(firstSkill);

      case "name-ascending":
      default:
        return compareText(firstSkill?.name, secondSkill?.name);
    }
  });

  return sortedSkills;
}

export function prepareSkillCollection({
  skills = [],
  query = "",
  filters = {},
  sortOption = "name-ascending",
} = {}) {
  return sortSkills(
    filterSkills(searchSkills(skills, query), filters),
    sortOption,
  );
}

/*
 * =========================================
 * Grouping
 * =========================================
 */

export function groupSkillsByCategory(skills = []) {
  return getArray(skills).reduce((groups, skill) => {
    const category = skill?.category || "other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(skill);

    return groups;
  }, {});
}

/*
 * =========================================
 * Completeness
 * =========================================
 */

export function getSkillCompleteness(skill) {
  const isLanguage = skill?.type === "language";

  const checks = [
    {
      id: "name",
      label: "Skill name",
      complete: Boolean(getText(skill?.name)),
      weight: 3,
    },
    {
      id: "category",
      label: "Category",
      complete: Boolean(getText(skill?.category) && skill.category !== "other"),
      weight: 1,
    },
    {
      id: "type",
      label: "Skill type",
      complete: Boolean(getText(skill?.type) && skill.type !== "other"),
      weight: 1,
    },
    {
      id: "description",
      label: "Description",
      complete: Boolean(getText(skill?.description)),
      weight: 2,
    },
    {
      id: "proficiency",
      label: isLanguage ? "Language proficiency" : "Proficiency",
      complete: isLanguage
        ? Boolean(getText(skill?.language?.proficiency))
        : Boolean(getText(skill?.proficiency?.level)),
      weight: 1,
    },
    {
      id: "experience",
      label: "Experience information",
      complete:
        getNumericValue(skill?.proficiency?.yearsOfExperience, -1) >= 0 ||
        Boolean(getText(skill?.proficiency?.lastUsedDate)),
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
  } else if (percentage >= 45) {
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
 * Relationship Helpers
 * =========================================
 */

function getRelationshipSkillId(relationship) {
  if (!relationship || typeof relationship !== "object") {
    return "";
  }

  return String(
    relationship.skillId || relationship.profileSkillId || "",
  ).trim();
}

function countSkillRelationships(relationships, skillId) {
  return getArray(relationships).filter(
    (relationship) => getRelationshipSkillId(relationship) === skillId,
  ).length;
}

function getExperienceLabels(experience) {
  return {
    positionTitle: getText(experience?.position?.title) || "Untitled Position",

    organizationName:
      getText(experience?.organization?.name) || "Organization not provided",
  };
}

/*
 * =========================================
 * Empty Usage
 * =========================================
 */

export function createEmptySkillUsage(skillId = "") {
  return {
    skillId,

    /*
     * Total number of relationships.
     */

    total: 0,
    totalUsage: 0,

    /*
     * Unique parent records.
     */

    experienceCount: 0,
    resumeCount: 0,
    portfolioCount: 0,

    /*
     * Relationship-type totals.
     */

    experienceSkillCount: 0,
    experienceTechnologyCount: 0,

    experiences: [],
    resumes: [],
    portfolios: [],

    isUsed: false,
  };
}

/*
 * =========================================
 * Experience Usage
 * =========================================
 */

export function getSkillExperienceUsage(skillId, experiences = []) {
  const usage = createEmptySkillUsage(skillId);

  if (!skillId) {
    return usage;
  }

  getArray(experiences).forEach((experience) => {
    const experienceSkillCount = countSkillRelationships(
      experience?.skills,
      skillId,
    );

    const experienceTechnologyCount = countSkillRelationships(
      experience?.technologies,
      skillId,
    );

    const usedAsSkill = experienceSkillCount > 0;

    const usedAsTechnology = experienceTechnologyCount > 0;

    if (!usedAsSkill && !usedAsTechnology) {
      return;
    }

    const labels = getExperienceLabels(experience);

    usage.experienceSkillCount += experienceSkillCount;

    usage.experienceTechnologyCount += experienceTechnologyCount;

    usage.experiences.push({
      id: experience?.id || "",

      positionTitle: labels.positionTitle,

      organizationName: labels.organizationName,

      usedAsSkill,

      usedAsTechnology,
    });
  });

  usage.experienceCount = usage.experiences.length;

  usage.total = usage.experienceSkillCount + usage.experienceTechnologyCount;

  usage.totalUsage = usage.total;
  usage.isUsed = usage.total > 0;

  return usage;
}

/*
 * =========================================
 * Skill Usage
 * =========================================
 */

export function getSkillUsage(
  skillId,
  { experiences = [], portfolios = [], resumes = [] } = {},
) {
  const usage = getSkillExperienceUsage(skillId, experiences);

  /*
   * These collections are reserved until their
   * relationship models are implemented.
   */

  usage.resumes = [];
  usage.portfolios = [];

  usage.resumeCount = 0;
  usage.portfolioCount = 0;

  usage.totalUsage = usage.total;
  usage.isUsed = usage.total > 0;

  void portfolios;
  void resumes;

  return usage;
}

/*
 * =========================================
 * Usage Map
 * =========================================
 */

export function createSkillUsageMap({
  skills = [],
  experiences = [],
  portfolios = [],
  resumes = [],
} = {}) {
  return getArray(skills).reduce((usageMap, skill) => {
    if (!skill?.id) {
      return usageMap;
    }

    usageMap[skill.id] = getSkillUsage(skill.id, {
      experiences,
      portfolios,
      resumes,
    });

    return usageMap;
  }, {});
}

export function isSkillInUse(usage) {
  return Number(usage?.total ?? usage?.totalUsage) > 0;
}

export function getSkillUsageSummary(usage) {
  if (!isSkillInUse(usage)) {
    return "Not currently used";
  }

  const parts = [];

  if (Number(usage?.experienceCount) > 0) {
    const count = Number(usage.experienceCount);

    parts.push(`${count} ${count === 1 ? "experience" : "experiences"}`);
  }

  if (Number(usage?.resumeCount) > 0) {
    const count = Number(usage.resumeCount);

    parts.push(`${count} ${count === 1 ? "résumé" : "résumés"}`);
  }

  if (Number(usage?.portfolioCount) > 0) {
    const count = Number(usage.portfolioCount);

    parts.push(`${count} ${count === 1 ? "portfolio" : "portfolios"}`);
  }

  return parts.join(" · ");
}

/*
 * =========================================
 * Statistics
 * =========================================
 */

export function getSkillStatistics(skills = []) {
  const collection = getArray(skills);

  const active = getActiveSkills(collection);

  const archived = getArchivedSkills(collection);

  return {
    total: collection.length,

    active: active.length,

    archived: archived.length,

    technical: active.filter((skill) => skill.type === "technical").length,

    professional: active.filter((skill) => skill.type === "professional")
      .length,

    languages: active.filter((skill) => skill.type === "language").length,

    tools: active.filter((skill) => skill.type === "tool").length,

    aiSuggested: active.filter((skill) => skill.source === "ai-suggested")
      .length,

    withDescriptions: active.filter((skill) =>
      Boolean(getText(skill.description)),
    ).length,

    withProficiency: active.filter((skill) =>
      Boolean(
        getText(skill.proficiency?.level) ||
        getText(skill.language?.proficiency),
      ),
    ).length,

    categoryCount: new Set(
      active.map((skill) => skill.category).filter(Boolean),
    ).size,
  };
}

/*
 * =========================================
 * Selection Options
 * =========================================
 */

export function createSkillSelectionOptions(skills = []) {
  return sortSkills(getActiveSkills(skills), "name-ascending").map((skill) => ({
    id: skill.id,
    value: skill.id,
    label: skill.name,
    displayValue: skill.name,
    category: skill.category,

    categoryLabel: getSkillCategoryDisplay(skill),

    type: skill.type,

    typeLabel: getSkillTypeDisplay(skill),

    proficiency: skill.proficiency?.level || "",
  }));
}
