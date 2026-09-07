import {
  EXPERIENCE_FIELD_LIMITS,
  isValidEmploymentType,
  isValidExperienceCategory,
  isValidExperienceStatus,
  isValidWorkArrangement,
} from "../config/experienceConfig.js";

/*
 * =========================================
 * Model Version
 * =========================================
 *
 * This allows saved browser data and future
 * database records to be migrated safely.
 */

export const EXPERIENCE_MODEL_VERSION = 1;

/*
 * =========================================
 * ID Creation
 * =========================================
 */

export function createExperienceId(prefix = "experience") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/*
 * =========================================
 * Primitive Normalization
 * =========================================
 */

function normalizeText(value, maximumLength = Infinity) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

function normalizeBoolean(value, defaultValue = false) {
  return typeof value === "boolean" ? value : defaultValue;
}

function normalizeNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.max(0, Math.trunc(numberValue));
}

function normalizeDate(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  /*
   * The form uses YYYY-MM values, but this also
   * permits YYYY-MM-DD records imported later.
   */

  if (
    !/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/.test(trimmedValue)
  ) {
    return "";
  }

  return trimmedValue;
}

function normalizeIdentifierList(values, maximumItems) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) => {
          if (typeof value === "string") {
            return value.trim();
          }

          return String(value?.id || "").trim();
        })
        .filter(Boolean),
    ),
  ].slice(0, maximumItems);
}

/*
 * =========================================
 * Responsibility Model
 * =========================================
 */

export function createResponsibility(value = {}) {
  const source =
    typeof value === "string"
      ? {
          text: value,
        }
      : value || {};

  return {
    id: normalizeText(source.id, 200) || createExperienceId("responsibility"),

    text: normalizeText(
      source.text || source.description,
      EXPERIENCE_FIELD_LIMITS.responsibilityText,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeResponsibilities(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createResponsibility)
    .filter((responsibility) => responsibility.text)
    .slice(0, EXPERIENCE_FIELD_LIMITS.maximumResponsibilities)
    .map((responsibility, index) => ({
      ...responsibility,
      order: index,
    }));
}

/*
 * =========================================
 * Achievement Model
 * =========================================
 */

export function createAchievement(value = {}) {
  const source =
    typeof value === "string"
      ? {
          text: value,
        }
      : value || {};

  return {
    id: normalizeText(source.id, 200) || createExperienceId("achievement"),

    text: normalizeText(
      source.text || source.description || source.value,
      EXPERIENCE_FIELD_LIMITS.achievementText,
    ),

    metric: normalizeText(
      source.metric,
      EXPERIENCE_FIELD_LIMITS.achievementMetric,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeAchievements(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createAchievement)
    .filter((achievement) => achievement.text)
    .slice(0, EXPERIENCE_FIELD_LIMITS.maximumAchievements)
    .map((achievement, index) => ({
      ...achievement,
      order: index,
    }));
}

/*
 * =========================================
 * Experience Skill Model
 * =========================================
 */

export function createExperienceSkill(value = {}) {
  const source =
    typeof value === "string"
      ? {
          nameSnapshot: value,
        }
      : value || {};

  return {
    id: normalizeText(source.id, 200) || createExperienceId("experience-skill"),

    /*
     * Permanent relationship to the central
     * Skill Library.
     */

    skillId: normalizeText(source.skillId || source.profileSkillId, 200),

    /*
     * Snapshot allows old experiences to retain a
     * readable name if a central skill is archived
     * or temporarily unavailable.
     */

    nameSnapshot: normalizeText(
      source.nameSnapshot || source.name || source.label || source.value,
      EXPERIENCE_FIELD_LIMITS.skillName,
    ),

    /*
     * Experience-specific proficiency. This can
     * differ from the central skill's default.
     */

    level: normalizeText(source.level, 50),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeExperienceSkills(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedSkills = values
    .map(createExperienceSkill)
    .filter((skill) => skill.skillId || skill.nameSnapshot);

  const uniqueSkills = normalizedSkills.filter((skill, index, collection) => {
    const identity = (skill.skillId || skill.nameSnapshot).toLocaleLowerCase();

    return (
      collection.findIndex((candidate) => {
        const candidateIdentity = (
          candidate.skillId || candidate.nameSnapshot
        ).toLocaleLowerCase();

        return candidateIdentity === identity;
      }) === index
    );
  });

  return uniqueSkills
    .slice(0, EXPERIENCE_FIELD_LIMITS.maximumSkills)
    .map((skill, index) => ({
      ...skill,
      order: index,
    }));
}

/*
 * =========================================
 * Technology Model
 * =========================================
 */

export function createExperienceTechnology(value = {}) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value || {};

  return {
    id: normalizeText(source.id, 200) || createExperienceId("technology"),

    name: normalizeText(
      source.name || source.label || source.value,
      EXPERIENCE_FIELD_LIMITS.technologyName,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeTechnologies(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedTechnologies = values
    .map(createExperienceTechnology)
    .filter((technology) => technology.name);

  const uniqueTechnologies = normalizedTechnologies.filter(
    (technology, index, collection) =>
      collection.findIndex(
        (candidate) =>
          candidate.name.toLowerCase() === technology.name.toLowerCase(),
      ) === index,
  );

  return uniqueTechnologies
    .slice(0, EXPERIENCE_FIELD_LIMITS.maximumTechnologies)
    .map((technology, index) => ({
      ...technology,
      order: index,
    }));
}

/*
 * =========================================
 * Empty Experience
 * =========================================
 */

export function createEmptyExperience() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: EXPERIENCE_MODEL_VERSION,

    id: createExperienceId(),

    category: "employment",

    position: {
      title: "",
      employmentType: "full-time",
      workArrangement: "on-site",
    },

    organization: {
      name: "",
      website: "",
      industry: "",
    },

    location: {
      city: "",
      stateRegion: "",
      country: "",
      displayValue: "",
    },

    dates: {
      startDate: "",
      endDate: "",
      isCurrent: false,
    },

    overview: "",

    responsibilities: [],

    achievements: [],

    skills: [],

    technologies: [],

    /*
     * These values reference records from the
     * central Projects collection.
     */

    relatedProjectIds: [],

    leadership: {
      hasLeadershipResponsibilities: false,
      peopleManaged: null,
      description: "",
    },

    /*
     * Career-management information is private
     * and should never be displayed automatically
     * on a public résumé or portfolio.
     */

    privateInformation: {
      reasonForLeaving: "",
      notes: "",
    },

    visibility: {
      showOrganizationWebsite: true,
      showLocation: true,
      showEmploymentType: true,
      showWorkArrangement: true,
      showResponsibilities: true,
      showAchievements: true,
      showSkills: true,
      showTechnologies: true,
    },

    status: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Experience Normalization
 * =========================================
 */

export function normalizeExperience(value = {}) {
  const defaults = createEmptyExperience();
  const source = value && typeof value === "object" ? value : {};

  const position =
    source.position && typeof source.position === "object"
      ? source.position
      : {};

  const organization =
    source.organization && typeof source.organization === "object"
      ? source.organization
      : {};

  const location =
    source.location && typeof source.location === "object"
      ? source.location
      : {};

  const dates =
    source.dates && typeof source.dates === "object" ? source.dates : {};

  const leadership =
    source.leadership && typeof source.leadership === "object"
      ? source.leadership
      : {};

  const privateInformation =
    source.privateInformation && typeof source.privateInformation === "object"
      ? source.privateInformation
      : {};

  const visibility =
    source.visibility && typeof source.visibility === "object"
      ? source.visibility
      : {};

  const category = isValidExperienceCategory(source.category)
    ? source.category
    : defaults.category;

  const employmentType = isValidEmploymentType(position.employmentType)
    ? position.employmentType
    : defaults.position.employmentType;

  const workArrangement = isValidWorkArrangement(position.workArrangement)
    ? position.workArrangement
    : defaults.position.workArrangement;

  const status = isValidExperienceStatus(source.status)
    ? source.status
    : defaults.status;

  const isCurrent = normalizeBoolean(dates.isCurrent, false);

  return {
    modelVersion: EXPERIENCE_MODEL_VERSION,

    id: normalizeText(source.id, 200) || defaults.id,

    category,

    position: {
      title: normalizeText(
        position.title || source.positionTitle || source.title || source.role,
        EXPERIENCE_FIELD_LIMITS.positionTitle,
      ),

      employmentType,

      workArrangement,
    },

    organization: {
      name: normalizeText(
        organization.name ||
          source.organizationName ||
          source.company ||
          source.employer,
        EXPERIENCE_FIELD_LIMITS.organizationName,
      ),

      website: normalizeText(
        organization.website || source.organizationWebsite,
        EXPERIENCE_FIELD_LIMITS.organizationWebsite,
      ),

      industry: normalizeText(
        organization.industry || source.industry,
        EXPERIENCE_FIELD_LIMITS.industry,
      ),
    },

    location: {
      city: normalizeText(location.city, EXPERIENCE_FIELD_LIMITS.city),

      stateRegion: normalizeText(
        location.stateRegion || location.state,
        EXPERIENCE_FIELD_LIMITS.stateRegion,
      ),

      country: normalizeText(location.country, EXPERIENCE_FIELD_LIMITS.country),

      displayValue: normalizeText(
        location.displayValue ||
          source.locationValue ||
          (typeof source.location === "string" ? source.location : ""),
        EXPERIENCE_FIELD_LIMITS.locationDisplayValue,
      ),
    },

    dates: {
      startDate: normalizeDate(dates.startDate || source.startDate),

      endDate: isCurrent ? "" : normalizeDate(dates.endDate || source.endDate),

      isCurrent,
    },

    overview: normalizeText(
      source.overview || source.description,
      EXPERIENCE_FIELD_LIMITS.overview,
    ),

    responsibilities: normalizeResponsibilities(source.responsibilities),

    achievements: normalizeAchievements(
      source.achievements || source.highlights,
    ),

    skills: normalizeExperienceSkills(source.skills),

    technologies: normalizeTechnologies(source.technologies || source.tools),

    relatedProjectIds: normalizeIdentifierList(
      source.relatedProjectIds || source.projectIds,
      EXPERIENCE_FIELD_LIMITS.maximumRelatedProjects,
    ),

    leadership: {
      hasLeadershipResponsibilities: normalizeBoolean(
        leadership.hasLeadershipResponsibilities,
        false,
      ),

      peopleManaged: normalizeNullableNumber(leadership.peopleManaged),

      description: normalizeText(
        leadership.description,
        EXPERIENCE_FIELD_LIMITS.leadershipDescription,
      ),
    },

    privateInformation: {
      reasonForLeaving: normalizeText(
        privateInformation.reasonForLeaving || source.reasonForLeaving,
        EXPERIENCE_FIELD_LIMITS.reasonForLeaving,
      ),

      notes: normalizeText(
        privateInformation.notes || source.privateNotes,
        EXPERIENCE_FIELD_LIMITS.privateNotes,
      ),
    },

    visibility: {
      showOrganizationWebsite: normalizeBoolean(
        visibility.showOrganizationWebsite,
        defaults.visibility.showOrganizationWebsite,
      ),

      showLocation: normalizeBoolean(
        visibility.showLocation,
        defaults.visibility.showLocation,
      ),

      showEmploymentType: normalizeBoolean(
        visibility.showEmploymentType,
        defaults.visibility.showEmploymentType,
      ),

      showWorkArrangement: normalizeBoolean(
        visibility.showWorkArrangement,
        defaults.visibility.showWorkArrangement,
      ),

      showResponsibilities: normalizeBoolean(
        visibility.showResponsibilities,
        defaults.visibility.showResponsibilities,
      ),

      showAchievements: normalizeBoolean(
        visibility.showAchievements,
        defaults.visibility.showAchievements,
      ),

      showSkills: normalizeBoolean(
        visibility.showSkills,
        defaults.visibility.showSkills,
      ),

      showTechnologies: normalizeBoolean(
        visibility.showTechnologies,
        defaults.visibility.showTechnologies,
      ),
    },

    status,

    createdAt: normalizeText(source.createdAt, 100) || defaults.createdAt,

    updatedAt: normalizeText(source.updatedAt, 100) || defaults.updatedAt,
  };
}

/*
 * =========================================
 * New Experience
 * =========================================
 */

export function createExperience(values = {}) {
  const timestamp = new Date().toISOString();

  return normalizeExperience({
    ...values,

    id: normalizeText(values.id, 200) || createExperienceId(),

    createdAt: normalizeText(values.createdAt, 100) || timestamp,

    updatedAt: timestamp,
  });
}

/*
 * =========================================
 * Updated Experience
 * =========================================
 */

export function updateExperienceModel(currentExperience, updates = {}) {
  return normalizeExperience({
    ...currentExperience,
    ...updates,

    position: {
      ...currentExperience?.position,
      ...updates.position,
    },

    organization: {
      ...currentExperience?.organization,
      ...updates.organization,
    },

    location: {
      ...currentExperience?.location,
      ...updates.location,
    },

    dates: {
      ...currentExperience?.dates,
      ...updates.dates,
    },

    leadership: {
      ...currentExperience?.leadership,
      ...updates.leadership,
    },

    privateInformation: {
      ...currentExperience?.privateInformation,
      ...updates.privateInformation,
    },

    visibility: {
      ...currentExperience?.visibility,
      ...updates.visibility,
    },

    id: currentExperience?.id,

    createdAt: currentExperience?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Collection Normalization
 * =========================================
 */

export function normalizeExperienceCollection(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedExperiences = values.map(normalizeExperience);

  return normalizedExperiences.filter(
    (experience, index, collection) =>
      collection.findIndex((candidate) => candidate.id === experience.id) ===
      index,
  );
}

/*
 * =========================================
 * Public Experience
 * =========================================
 *
 * Removes private career-management information
 * before an experience is used publicly.
 */

export function createPublicExperience(value) {
  const experience = normalizeExperience(value);

  const { privateInformation, ...publicExperience } = experience;

  return publicExperience;
}
