import {
  isValidLanguageProficiency,
  isValidSkillCategory,
  isValidSkillProficiency,
  isValidSkillSource,
  isValidSkillStatus,
  isValidSkillType,
  SKILL_FIELD_LIMITS,
} from "../../config/skillConfig.js";

import { normalizeSkillNameForComparison } from "../../models/skillModel.js";

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

function createIssue(field, message, code = "invalid") {
  return {
    field,
    message,
    code,
  };
}

/*
 * =========================================
 * Validation Collector
 * =========================================
 */

function createValidationCollector() {
  const errors = [];
  const warnings = [];
  const conflicts = [];

  return {
    errors,
    warnings,
    conflicts,

    addError(field, message, code) {
      errors.push(createIssue(field, message, code));
    },

    addWarning(field, message, code = "warning") {
      warnings.push(createIssue(field, message, code));
    },

    addConflict(field, message, conflictingSkill, code = "skill_conflict") {
      const conflict = {
        ...createIssue(field, message, code),

        conflictingSkillId: conflictingSkill?.id || "",

        conflictingSkillName: conflictingSkill?.name || "",
      };

      conflicts.push(conflict);
      errors.push(conflict);
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
 * Year-Month Validation
 * =========================================
 */

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidYearMonth(value) {
  return YEAR_MONTH_PATTERN.test(getText(value));
}

function getCurrentYearMonth() {
  const currentDate = new Date();

  const year = currentDate.getUTCFullYear();

  const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

/*
 * =========================================
 * Required Skill Name
 * =========================================
 */

function validateSkillName(collector, skill) {
  const name = getText(skill.name);

  if (!name) {
    collector.addError("name", "Enter a skill name.", "required");

    return;
  }

  validateTextLength(
    collector,
    "name",
    skill.name,
    SKILL_FIELD_LIMITS.name,
    "Skill name",
  );

  if (name.length < 2) {
    collector.addError(
      "name",
      "Skill name must contain at least two characters.",
      "too_short",
    );
  }

  if (!/[a-zA-Z0-9À-ž]/u.test(name)) {
    collector.addError(
      "name",
      "Skill name must contain letters or numbers.",
      "invalid_name",
    );
  }

  if (/^[\s.,;:!?()[\]{}'"`~@#$%^&*+=|\\/<>_-]+$/.test(name)) {
    collector.addError(
      "name",
      "Enter a meaningful skill name.",
      "invalid_name",
    );
  }
}

/*
 * =========================================
 * Configured Options
 * =========================================
 */

function validateConfiguredOptions(collector, skill) {
  if (!isValidSkillCategory(skill.category)) {
    collector.addError(
      "category",
      "Select a valid skill category.",
      "invalid_option",
    );
  }

  if (!isValidSkillType(skill.type)) {
    collector.addError("type", "Select a valid skill type.", "invalid_option");
  }

  const proficiency = getObject(skill.proficiency);

  if (!isValidSkillProficiency(proficiency.level ?? "")) {
    collector.addError(
      "proficiency.level",
      "Select a valid proficiency level.",
      "invalid_option",
    );
  }

  const language = getObject(skill.language);

  if (!isValidLanguageProficiency(language.proficiency ?? "")) {
    collector.addError(
      "language.proficiency",
      "Select a valid language proficiency.",
      "invalid_option",
    );
  }

  if (!isValidSkillSource(skill.source)) {
    collector.addError(
      "source",
      "Select a valid skill source.",
      "invalid_option",
    );
  }

  if (!isValidSkillStatus(skill.status)) {
    collector.addError(
      "status",
      "Select a valid skill status.",
      "invalid_option",
    );
  }
}

/*
 * =========================================
 * Description and Notes
 * =========================================
 */

function validateSupportingText(collector, skill) {
  validateTextLength(
    collector,
    "description",
    skill.description,
    SKILL_FIELD_LIMITS.description,
    "Skill description",
  );

  validateTextLength(
    collector,
    "notes",
    skill.notes,
    SKILL_FIELD_LIMITS.notes,
    "Private notes",
  );

  validateTextLength(
    collector,
    "sourceContext",
    skill.sourceContext,
    100,
    "Source context",
  );
}

/*
 * =========================================
 * Proficiency
 * =========================================
 */

function validateProficiency(collector, skill) {
  const proficiency = getObject(skill.proficiency);

  const level = getText(proficiency.level);

  const yearsOfExperience = proficiency.yearsOfExperience;

  if (
    yearsOfExperience !== "" &&
    yearsOfExperience !== null &&
    yearsOfExperience !== undefined
  ) {
    const numericYears = Number(yearsOfExperience);

    if (!Number.isFinite(numericYears) || numericYears < 0) {
      collector.addError(
        "proficiency.yearsOfExperience",
        "Years of experience must be zero or greater.",
        "invalid_number",
      );
    } else if (numericYears > SKILL_FIELD_LIMITS.yearsOfExperience) {
      collector.addError(
        "proficiency.yearsOfExperience",
        `Years of experience cannot exceed ${SKILL_FIELD_LIMITS.yearsOfExperience}.`,
        "invalid_number",
      );
    } else if (Math.round(numericYears * 10) !== numericYears * 10) {
      collector.addError(
        "proficiency.yearsOfExperience",
        "Years of experience can contain no more than one decimal place.",
        "invalid_precision",
      );
    }
  }

  const lastUsedDate = getText(proficiency.lastUsedDate);

  if (lastUsedDate && !isValidYearMonth(lastUsedDate)) {
    collector.addError(
      "proficiency.lastUsedDate",
      "Enter a valid last-used month and year.",
      "invalid_date",
    );
  }

  if (
    lastUsedDate &&
    isValidYearMonth(lastUsedDate) &&
    lastUsedDate > getCurrentYearMonth()
  ) {
    collector.addError(
      "proficiency.lastUsedDate",
      "The last-used date cannot be in the future.",
      "future_date",
    );
  }

  if (
    level === "expert" &&
    (yearsOfExperience === "" ||
      yearsOfExperience === null ||
      yearsOfExperience === undefined)
  ) {
    collector.addWarning(
      "proficiency.level",
      "Consider adding supporting experience before describing this skill as expert.",
      "expert_without_experience",
    );
  }

  if (
    level === "expert" &&
    Number(yearsOfExperience) > 0 &&
    Number(yearsOfExperience) < 3
  ) {
    collector.addWarning(
      "proficiency.level",
      "Review whether expert accurately describes this skill with the supplied experience duration.",
      "expert_level_review",
    );
  }
}

/*
 * =========================================
 * Language Rules
 * =========================================
 */

function validateLanguageRules(collector, skill) {
  const isLanguageType = skill.type === "language";

  const isLanguageCategory = skill.category === "language";

  const languageProficiency = getText(skill.language?.proficiency);

  if (isLanguageType && !isLanguageCategory) {
    collector.addError(
      "category",
      'A language skill must use the "Languages" category.',
      "language_category_mismatch",
    );
  }

  if (isLanguageCategory && !isLanguageType) {
    collector.addError(
      "type",
      'A skill in the "Languages" category must use the "Language Skill" type.',
      "language_type_mismatch",
    );
  }

  if (!isLanguageType && languageProficiency) {
    collector.addError(
      "language.proficiency",
      "Language proficiency can only be assigned to a language skill.",
      "unexpected_language_proficiency",
    );
  }

  if (isLanguageType && !languageProficiency) {
    collector.addWarning(
      "language.proficiency",
      "Consider selecting a language proficiency level.",
      "missing_language_proficiency",
    );
  }
}

/*
 * =========================================
 * Aliases
 * =========================================
 */

function getAliasText(alias) {
  if (typeof alias === "string") {
    return alias.trim();
  }

  return getText(alias?.name || alias?.value || alias?.label);
}

function validateAliases(collector, skill) {
  const aliases = getArray(skill.aliases);

  if (aliases.length > SKILL_FIELD_LIMITS.maximumAliases) {
    collector.addError(
      "aliases",
      `Add no more than ${SKILL_FIELD_LIMITS.maximumAliases} aliases.`,
      "too_many_items",
    );
  }

  const skillComparisonName = normalizeSkillNameForComparison(skill.name);

  const seenAliases = new Map();

  aliases.forEach((alias, index) => {
    const aliasText = getAliasText(alias);

    if (!aliasText) {
      collector.addError(
        `aliases.${index}`,
        "Skill alias cannot be empty.",
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `aliases.${index}`,
      aliasText,
      SKILL_FIELD_LIMITS.alias,
      "Skill alias",
    );

    const comparisonAlias = normalizeSkillNameForComparison(aliasText);

    if (comparisonAlias === skillComparisonName) {
      collector.addError(
        `aliases.${index}`,
        "An alias cannot be the same as the primary skill name.",
        "alias_matches_name",
      );
    }

    if (seenAliases.has(comparisonAlias)) {
      collector.addError(
        `aliases.${index}`,
        "This skill alias has already been added.",
        "duplicate_alias",
      );

      return;
    }

    seenAliases.set(comparisonAlias, index);
  });
}

/*
 * =========================================
 * Existing Library Helpers
 * =========================================
 */

function getSkillNames(skill) {
  const skillObject = getObject(skill);

  return [
    getText(skillObject.name),

    ...getArray(skillObject.aliases).map(getAliasText),
  ]
    .map(normalizeSkillNameForComparison)
    .filter(Boolean);
}

/*
 * =========================================
 * Existing Library Conflicts
 * =========================================
 */

function validateLibraryConflicts(
  collector,
  skill,
  existingSkills,
  excludeSkillId,
) {
  const proposedName = normalizeSkillNameForComparison(skill.name);

  if (!proposedName) {
    return;
  }

  const proposedAliases = getArray(skill.aliases)
    .map(getAliasText)
    .map(normalizeSkillNameForComparison)
    .filter(Boolean);

  getArray(existingSkills).forEach((existingSkill) => {
    if (
      existingSkill?.id === excludeSkillId ||
      existingSkill?.id === skill.id
    ) {
      return;
    }

    const existingNames = getSkillNames(existingSkill);

    if (existingNames.includes(proposedName)) {
      collector.addConflict(
        "name",
        `"${skill.name}" already exists in your Skill Library or matches an existing alias.`,
        existingSkill,
        "duplicate_library_skill",
      );

      return;
    }

    proposedAliases.forEach((proposedAlias, aliasIndex) => {
      if (existingNames.includes(proposedAlias)) {
        collector.addConflict(
          `aliases.${aliasIndex}`,
          `This alias is already used by "${existingSkill.name}".`,
          existingSkill,
          "duplicate_library_alias",
        );
      }
    });
  });
}

/*
 * =========================================
 * Meaningful Information
 * =========================================
 */

function validateMeaningfulInformation(collector, skill) {
  const name = getText(skill.name);
  const description = getText(skill.description);

  if (name && name.split(/\s+/).length === 1 && name.length <= 2) {
    collector.addWarning(
      "name",
      "Review this short skill name and consider using its complete professional name.",
      "short_skill_name",
    );
  }

  if (!description) {
    collector.addWarning(
      "description",
      "Consider adding a short description explaining how you use this skill.",
      "missing_description",
    );
  }

  if (skill.source === "ai-suggested" && !getText(skill.sourceContext)) {
    collector.addWarning(
      "sourceContext",
      "The origin of this AI-suggested skill was not recorded.",
      "missing_source_context",
    );
  }
}

/*
 * =========================================
 * Field Error Map
 * =========================================
 */

export function createSkillFieldErrorMap(errors = []) {
  return errors.reduce((fieldErrors, error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }

    return fieldErrors;
  }, {});
}

/*
 * =========================================
 * Main Skill Validation
 * =========================================
 */

export function validateSkill(
  skillValue,
  { existingSkills = [], excludeSkillId = "" } = {},
) {
  const skill = getObject(skillValue);

  const collector = createValidationCollector();

  validateSkillName(collector, skill);

  validateConfiguredOptions(collector, skill);

  validateSupportingText(collector, skill);

  validateProficiency(collector, skill);

  validateLanguageRules(collector, skill);

  validateAliases(collector, skill);

  validateLibraryConflicts(collector, skill, existingSkills, excludeSkillId);

  validateMeaningfulInformation(collector, skill);

  return {
    isValid: collector.errors.length === 0,

    errors: collector.errors,
    warnings: collector.warnings,
    conflicts: collector.conflicts,

    fieldErrors: createSkillFieldErrorMap(collector.errors),
  };
}

/*
 * =========================================
 * Skill Name Availability
 * =========================================
 */

export function validateSkillNameAvailability(
  name,
  existingSkills = [],
  excludeSkillId = "",
) {
  const normalizedName = normalizeSkillNameForComparison(name);

  if (!normalizedName) {
    return {
      isAvailable: false,
      matchingSkill: null,
      message: "Enter a skill name.",
    };
  }

  const matchingSkill =
    getArray(existingSkills).find((skill) => {
      if (skill?.id === excludeSkillId) {
        return false;
      }

      return getSkillNames(skill).includes(normalizedName);
    }) || null;

  if (matchingSkill) {
    return {
      isAvailable: false,
      matchingSkill,

      message: `"${name.trim()}" already exists as "${matchingSkill.name}".`,
    };
  }

  return {
    isAvailable: true,
    matchingSkill: null,
    message: "This skill name is available.",
  };
}

/*
 * =========================================
 * Assert Valid Skill
 * =========================================
 */

export function assertValidSkill(skill, options = {}) {
  const validationResult = validateSkill(skill, options);

  if (validationResult.isValid) {
    return validationResult;
  }

  const error = new Error(
    "The skill contains invalid or incomplete information.",
  );

  error.name = "SkillValidationError";
  error.code = "SKILL_VALIDATION_FAILED";
  error.status = 400;

  error.publicMessage =
    "Correct the highlighted skill information before saving.";

  error.validation = validationResult;
  error.errors = validationResult.errors;
  error.warnings = validationResult.warnings;
  error.conflicts = validationResult.conflicts;
  error.fieldErrors = validationResult.fieldErrors;

  throw error;
}

/*
 * =========================================
 * Validation Summary
 * =========================================
 */

export function getSkillValidationSummary(skill, options = {}) {
  const validationResult = validateSkill(skill, options);

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

  return "This skill is complete and ready to save.";
}
