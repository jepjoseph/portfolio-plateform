import {
  EXPERIENCE_FIELD_LIMITS,
  getEmploymentTypeLabel,
  getExperienceCategoryLabel,
  getExperienceStatusLabel,
  getWorkArrangementLabel,
  isValidEmploymentType,
  isValidExperienceCategory,
  isValidExperienceStatus,
  isValidWorkArrangement,
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

function getItemText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return getText(
    value.text || value.name || value.description || value.value || value.label,
  );
}

function hasText(value) {
  return getText(value).length > 0;
}

function createIssue(field, message, code = "invalid") {
  return {
    field,
    message,
    code,
  };
}

/*
 * =========================================
 * Date Helpers
 * =========================================
 */

const EXPERIENCE_DATE_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/;

function isValidExperienceDate(value) {
  const text = getText(value);

  if (!text || !EXPERIENCE_DATE_PATTERN.test(text)) {
    return false;
  }

  /*
   * YYYY-MM dates are valid after passing the
   * regular expression.
   */

  if (text.length === 7) {
    return true;
  }

  /*
   * Validate complete YYYY-MM-DD dates so values
   * such as February 31 are rejected.
   */

  const [year, month, day] = text.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getComparableDate(value, useEndOfMonth = false) {
  const text = getText(value);

  if (!isValidExperienceDate(text)) {
    return null;
  }

  const [year, month, suppliedDay] = text.split("-").map(Number);

  let day = suppliedDay;

  if (!day) {
    day = useEndOfMonth ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 1;
  }

  return Date.UTC(year, month - 1, day);
}

/*
 * =========================================
 * URL Validation
 * =========================================
 */

function isValidWebsite(value) {
  const text = getText(value);

  if (!text) {
    return true;
  }

  try {
    const normalizedUrl = /^https?:\/\//i.test(text) ? text : `https://${text}`;

    const url = new URL(normalizedUrl);

    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/*
 * =========================================
 * Validation Collector
 * =========================================
 */

function createValidationCollector() {
  const errors = [];
  const warnings = [];

  return {
    errors,
    warnings,

    addError(field, message, code) {
      errors.push(createIssue(field, message, code));
    },

    addWarning(field, message, code = "warning") {
      warnings.push(createIssue(field, message, code));
    },
  };
}

/*
 * =========================================
 * Text Length Validation
 * =========================================
 */

function validateTextLength(collector, field, value, maximumLength, label) {
  if (typeof value !== "string") {
    return;
  }

  if (value.trim().length > maximumLength) {
    collector.addError(
      field,
      `${label} cannot exceed ${maximumLength} characters.`,
      "too_long",
    );
  }
}

/*
 * =========================================
 * Duplicate Validation
 * =========================================
 */

function findDuplicateIndexes(values, getIdentity) {
  const seen = new Map();
  const duplicates = [];

  values.forEach((value, index) => {
    const identity = getIdentity(value).trim().toLocaleLowerCase();

    if (!identity) {
      return;
    }

    if (seen.has(identity)) {
      duplicates.push({
        firstIndex: seen.get(identity),
        duplicateIndex: index,
      });

      return;
    }

    seen.set(identity, index);
  });

  return duplicates;
}

/*
 * =========================================
 * Required Information
 * =========================================
 */

function validateRequiredInformation(collector, experience) {
  const position = getObject(experience.position);
  const organization = getObject(experience.organization);
  const dates = getObject(experience.dates);

  if (!hasText(position.title)) {
    collector.addError(
      "position.title",
      "Enter the position or role title.",
      "required",
    );
  }

  if (!hasText(organization.name)) {
    collector.addError(
      "organization.name",
      "Enter the organization, employer, or client name.",
      "required",
    );
  }

  if (!hasText(dates.startDate)) {
    collector.addError(
      "dates.startDate",
      "Enter the experience start date.",
      "required",
    );
  }
}

/*
 * =========================================
 * Category and Option Validation
 * =========================================
 */

function validateConfiguredOptions(collector, experience) {
  const position = getObject(experience.position);

  if (!isValidExperienceCategory(experience.category)) {
    collector.addError(
      "category",
      "Select a valid experience category.",
      "invalid_option",
    );
  }

  if (!isValidEmploymentType(position.employmentType)) {
    collector.addError(
      "position.employmentType",
      "Select a valid employment type.",
      "invalid_option",
    );
  }

  if (!isValidWorkArrangement(position.workArrangement)) {
    collector.addError(
      "position.workArrangement",
      "Select a valid work arrangement.",
      "invalid_option",
    );
  }

  if (!isValidExperienceStatus(experience.status)) {
    collector.addError(
      "status",
      "Select a valid experience status.",
      "invalid_option",
    );
  }
}

/*
 * =========================================
 * Date Validation
 * =========================================
 */

function validateDates(collector, experience) {
  const dates = getObject(experience.dates);

  const startDate = getText(dates.startDate);
  const endDate = getText(dates.endDate);
  const isCurrent = dates.isCurrent === true;

  if (startDate && !isValidExperienceDate(startDate)) {
    collector.addError(
      "dates.startDate",
      "Enter a valid start date.",
      "invalid_date",
    );
  }

  if (isCurrent && endDate) {
    collector.addError(
      "dates.endDate",
      "A current position cannot have an end date.",
      "current_position_has_end_date",
    );
  }

  if (!isCurrent && !endDate) {
    collector.addError(
      "dates.endDate",
      "Enter an end date or mark this position as current.",
      "required",
    );
  }

  if (!isCurrent && endDate && !isValidExperienceDate(endDate)) {
    collector.addError(
      "dates.endDate",
      "Enter a valid end date.",
      "invalid_date",
    );
  }

  if (
    startDate &&
    endDate &&
    isValidExperienceDate(startDate) &&
    isValidExperienceDate(endDate)
  ) {
    const comparableStartDate = getComparableDate(startDate);

    const comparableEndDate = getComparableDate(endDate, true);

    if (comparableEndDate < comparableStartDate) {
      collector.addError(
        "dates.endDate",
        "The end date cannot be earlier than the start date.",
        "invalid_date_order",
      );
    }
  }
}

/*
 * =========================================
 * Position and Organization
 * =========================================
 */

function validatePositionAndOrganization(collector, experience) {
  const position = getObject(experience.position);
  const organization = getObject(experience.organization);

  validateTextLength(
    collector,
    "position.title",
    position.title,
    EXPERIENCE_FIELD_LIMITS.positionTitle,
    "Position title",
  );

  validateTextLength(
    collector,
    "organization.name",
    organization.name,
    EXPERIENCE_FIELD_LIMITS.organizationName,
    "Organization name",
  );

  validateTextLength(
    collector,
    "organization.website",
    organization.website,
    EXPERIENCE_FIELD_LIMITS.organizationWebsite,
    "Organization website",
  );

  validateTextLength(
    collector,
    "organization.industry",
    organization.industry,
    EXPERIENCE_FIELD_LIMITS.industry,
    "Industry",
  );

  if (organization.website && !isValidWebsite(organization.website)) {
    collector.addError(
      "organization.website",
      "Enter a valid organization website.",
      "invalid_url",
    );
  }
}

/*
 * =========================================
 * Location
 * =========================================
 */

function validateLocation(collector, experience) {
  const location = getObject(experience.location);

  validateTextLength(
    collector,
    "location.city",
    location.city,
    EXPERIENCE_FIELD_LIMITS.city,
    "City",
  );

  validateTextLength(
    collector,
    "location.stateRegion",
    location.stateRegion,
    EXPERIENCE_FIELD_LIMITS.stateRegion,
    "State or region",
  );

  validateTextLength(
    collector,
    "location.country",
    location.country,
    EXPERIENCE_FIELD_LIMITS.country,
    "Country",
  );

  validateTextLength(
    collector,
    "location.displayValue",
    location.displayValue,
    EXPERIENCE_FIELD_LIMITS.locationDisplayValue,
    "Display location",
  );
}

/*
 * =========================================
 * Overview
 * =========================================
 */

function validateOverview(collector, experience) {
  validateTextLength(
    collector,
    "overview",
    experience.overview,
    EXPERIENCE_FIELD_LIMITS.overview,
    "Experience overview",
  );
}

/*
 * =========================================
 * Responsibilities
 * =========================================
 */

function validateResponsibilities(collector, experience) {
  const responsibilities = getArray(experience.responsibilities);

  if (
    responsibilities.length > EXPERIENCE_FIELD_LIMITS.maximumResponsibilities
  ) {
    collector.addError(
      "responsibilities",
      `Add no more than ${EXPERIENCE_FIELD_LIMITS.maximumResponsibilities} responsibilities.`,
      "too_many_items",
    );
  }

  responsibilities.forEach((responsibility, index) => {
    const text = getItemText(responsibility);

    if (!text) {
      collector.addError(
        `responsibilities.${index}.text`,
        "Responsibility text cannot be empty.",
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `responsibilities.${index}.text`,
      text,
      EXPERIENCE_FIELD_LIMITS.responsibilityText,
      "Responsibility",
    );
  });

  const duplicates = findDuplicateIndexes(responsibilities, getItemText);

  duplicates.forEach(({ duplicateIndex }) => {
    collector.addError(
      `responsibilities.${duplicateIndex}.text`,
      "This responsibility has already been added.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Achievements
 * =========================================
 */

function validateAchievements(collector, experience) {
  const achievements = getArray(experience.achievements);

  if (achievements.length > EXPERIENCE_FIELD_LIMITS.maximumAchievements) {
    collector.addError(
      "achievements",
      `Add no more than ${EXPERIENCE_FIELD_LIMITS.maximumAchievements} achievements.`,
      "too_many_items",
    );
  }

  achievements.forEach((achievement, index) => {
    const item = getObject(achievement);
    const text = getItemText(achievement);

    if (!text) {
      collector.addError(
        `achievements.${index}.text`,
        "Achievement text cannot be empty.",
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `achievements.${index}.text`,
      text,
      EXPERIENCE_FIELD_LIMITS.achievementText,
      "Achievement",
    );

    validateTextLength(
      collector,
      `achievements.${index}.metric`,
      item.metric,
      EXPERIENCE_FIELD_LIMITS.achievementMetric,
      "Achievement metric",
    );
  });

  const duplicates = findDuplicateIndexes(achievements, getItemText);

  duplicates.forEach(({ duplicateIndex }) => {
    collector.addError(
      `achievements.${duplicateIndex}.text`,
      "This achievement has already been added.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Skills
 * =========================================
 */

function validateSkills(collector, experience) {
  const skills = getArray(experience.skills);

  if (skills.length > EXPERIENCE_FIELD_LIMITS.maximumSkills) {
    collector.addError(
      "skills",
      `Add no more than ${EXPERIENCE_FIELD_LIMITS.maximumSkills} skills.`,
      "too_many_items",
    );
  }

  skills.forEach((skill, index) => {
    const item = getObject(skill);

    const skillId = getText(item.skillId || item.profileSkillId);

    const nameSnapshot = getText(item.nameSnapshot || item.name);

    if (!skillId && !nameSnapshot) {
      collector.addError(
        `skills.${index}.skillId`,
        "Select a saved skill or create a new one.",
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `skills.${index}.nameSnapshot`,
      nameSnapshot,
      EXPERIENCE_FIELD_LIMITS.skillName,
      "Skill name",
    );

    if (
      item.level &&
      !["", "foundational", "intermediate", "advanced", "expert"].includes(
        item.level,
      )
    ) {
      collector.addError(
        `skills.${index}.level`,
        "Select a valid experience-specific proficiency level.",
        "invalid_option",
      );
    }
  });

  const duplicates = findDuplicateIndexes(skills, (skill) => {
    const item = getObject(skill);

    return (
      getText(item.skillId || item.profileSkillId) ||
      getText(item.nameSnapshot || item.name)
    );
  });

  duplicates.forEach(({ duplicateIndex }) => {
    collector.addError(
      `skills.${duplicateIndex}.skillId`,
      "This skill has already been added to the experience.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Technologies
 * =========================================
 */

function validateTechnologies(collector, experience) {
  const technologies = getArray(experience.technologies);

  if (technologies.length > EXPERIENCE_FIELD_LIMITS.maximumTechnologies) {
    collector.addError(
      "technologies",
      `Add no more than ${EXPERIENCE_FIELD_LIMITS.maximumTechnologies} technologies.`,
      "too_many_items",
    );
  }

  technologies.forEach((technology, index) => {
    const name = getItemText(technology);

    if (!name) {
      collector.addError(
        `technologies.${index}.name`,
        "Technology name cannot be empty.",
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `technologies.${index}.name`,
      name,
      EXPERIENCE_FIELD_LIMITS.technologyName,
      "Technology name",
    );
  });

  const duplicates = findDuplicateIndexes(technologies, getItemText);

  duplicates.forEach(({ duplicateIndex }) => {
    collector.addError(
      `technologies.${duplicateIndex}.name`,
      "This technology has already been added.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Related Projects
 * =========================================
 */

function validateRelatedProjects(collector, experience) {
  const projectIds = getArray(experience.relatedProjectIds);

  if (projectIds.length > EXPERIENCE_FIELD_LIMITS.maximumRelatedProjects) {
    collector.addError(
      "relatedProjectIds",
      `Select no more than ${EXPERIENCE_FIELD_LIMITS.maximumRelatedProjects} related projects.`,
      "too_many_items",
    );
  }

  const normalizedIds = projectIds
    .map((projectId) => getText(projectId))
    .filter(Boolean);

  const duplicates = findDuplicateIndexes(
    normalizedIds,
    (projectId) => projectId,
  );

  duplicates.forEach(({ duplicateIndex }) => {
    collector.addError(
      `relatedProjectIds.${duplicateIndex}`,
      "This related project has already been selected.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Leadership
 * =========================================
 */

function validateLeadership(collector, experience) {
  const leadership = getObject(experience.leadership);

  const hasLeadershipResponsibilities =
    leadership.hasLeadershipResponsibilities === true;

  const peopleManaged = leadership.peopleManaged;

  if (
    peopleManaged !== "" &&
    peopleManaged !== null &&
    peopleManaged !== undefined
  ) {
    const numberValue = Number(peopleManaged);

    if (!Number.isInteger(numberValue) || numberValue < 0) {
      collector.addError(
        "leadership.peopleManaged",
        "People managed must be a whole number of zero or greater.",
        "invalid_number",
      );
    }

    if (numberValue > 100000) {
      collector.addError(
        "leadership.peopleManaged",
        "Enter a realistic number of people managed.",
        "invalid_number",
      );
    }

    if (!hasLeadershipResponsibilities && numberValue > 0) {
      collector.addWarning(
        "leadership.hasLeadershipResponsibilities",
        "People managed was entered, but leadership responsibilities are not enabled.",
        "leadership_mismatch",
      );
    }
  }

  validateTextLength(
    collector,
    "leadership.description",
    leadership.description,
    EXPERIENCE_FIELD_LIMITS.leadershipDescription,
    "Leadership description",
  );
}

/*
 * =========================================
 * Private Information
 * =========================================
 */

function validatePrivateInformation(collector, experience) {
  const privateInformation = getObject(experience.privateInformation);

  validateTextLength(
    collector,
    "privateInformation.reasonForLeaving",
    privateInformation.reasonForLeaving,
    EXPERIENCE_FIELD_LIMITS.reasonForLeaving,
    "Reason for leaving",
  );

  validateTextLength(
    collector,
    "privateInformation.notes",
    privateInformation.notes,
    EXPERIENCE_FIELD_LIMITS.privateNotes,
    "Private notes",
  );
}

/*
 * =========================================
 * Meaningful Content
 * =========================================
 */

function validateMeaningfulContent(collector, experience) {
  const hasOverview = hasText(experience.overview);

  const hasResponsibility = getArray(experience.responsibilities).some(
    (responsibility) => hasText(getItemText(responsibility)),
  );

  const hasAchievement = getArray(experience.achievements).some((achievement) =>
    hasText(getItemText(achievement)),
  );

  if (!hasOverview && !hasResponsibility && !hasAchievement) {
    collector.addError(
      "overview",
      "Add an overview, responsibility, or achievement that explains what you did.",
      "insufficient_content",
    );
  }

  if (!hasAchievement) {
    collector.addWarning(
      "achievements",
      "Consider adding at least one achievement or outcome to strengthen this experience.",
      "missing_achievement",
    );
  }

  const hasCapability =
    getArray(experience.skills).some((skill) => {
      const item = getObject(skill);

      return Boolean(
        getText(item.skillId) ||
        getText(item.nameSnapshot) ||
        getText(item.name),
      );
    }) ||
    getArray(experience.technologies).some((technology) =>
      Boolean(getItemText(technology)),
    );

  if (!hasCapability) {
    collector.addWarning(
      "skills",
      "Consider adding relevant skills or technologies used in this role.",
      "missing_capability",
    );
  }
}

/*
 * =========================================
 * Build Field Error Map
 * =========================================
 */

export function createExperienceFieldErrorMap(errors = []) {
  return errors.reduce((fieldErrors, error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }

    return fieldErrors;
  }, {});
}

/*
 * =========================================
 * Main Validation
 * =========================================
 */

export function validateExperience(experienceValue) {
  const experience = getObject(experienceValue);
  const collector = createValidationCollector();

  validateRequiredInformation(collector, experience);

  validateConfiguredOptions(collector, experience);

  validateDates(collector, experience);

  validatePositionAndOrganization(collector, experience);

  validateLocation(collector, experience);
  validateOverview(collector, experience);

  validateResponsibilities(collector, experience);

  validateAchievements(collector, experience);
  validateSkills(collector, experience);

  validateTechnologies(collector, experience);

  validateRelatedProjects(collector, experience);

  validateLeadership(collector, experience);

  validatePrivateInformation(collector, experience);

  validateMeaningfulContent(collector, experience);

  return {
    isValid: collector.errors.length === 0,
    errors: collector.errors,
    warnings: collector.warnings,

    fieldErrors: createExperienceFieldErrorMap(collector.errors),
  };
}

/*
 * =========================================
 * Assertion for Save Operations
 * =========================================
 */

export function assertValidExperience(experience) {
  const validationResult = validateExperience(experience);

  if (validationResult.isValid) {
    return validationResult;
  }

  const error = new Error(
    "The experience contains invalid or incomplete information.",
  );

  error.name = "ExperienceValidationError";
  error.code = "EXPERIENCE_VALIDATION_FAILED";
  error.status = 400;

  error.validation = validationResult;
  error.errors = validationResult.errors;
  error.fieldErrors = validationResult.fieldErrors;

  throw error;
}

/*
 * =========================================
 * Human-Readable Summary
 * =========================================
 */

export function getExperienceValidationSummary(experience) {
  const validationResult = validateExperience(experience);

  if (!validationResult.isValid) {
    return `${validationResult.errors.length} ${
      validationResult.errors.length === 1 ? "problem must" : "problems must"
    } be corrected before saving.`;
  }

  if (validationResult.warnings.length > 0) {
    return `Ready to save with ${validationResult.warnings.length} ${
      validationResult.warnings.length === 1 ? "suggestion" : "suggestions"
    } for improvement.`;
  }

  return "This experience is complete and ready to save.";
}

/*
 * =========================================
 * Development Description
 * =========================================
 */

export function getExperienceDescription(experience) {
  const position = getObject(experience?.position);

  const organization = getObject(experience?.organization);

  const parts = [
    getText(position.title),
    getText(organization.name),
    getEmploymentTypeLabel(position.employmentType),
    getWorkArrangementLabel(position.workArrangement),
    getExperienceCategoryLabel(experience?.category),
    getExperienceStatusLabel(experience?.status),
  ].filter(Boolean);

  return parts.join(" · ");
}
