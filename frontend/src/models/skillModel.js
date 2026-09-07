import {
  DEFAULT_SKILL_VALUES,
  isValidLanguageProficiency,
  isValidSkillCategory,
  isValidSkillProficiency,
  isValidSkillSource,
  isValidSkillStatus,
  isValidSkillType,
  SKILL_FIELD_LIMITS,
} from "../config/skillConfig.js";

/*
 * =========================================
 * Model Version
 * =========================================
 */

export const SKILL_MODEL_VERSION = 1;

/*
 * =========================================
 * ID Creation
 * =========================================
 */

export function createSkillId(prefix = "skill") {
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

function normalizeNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return Number(numberValue.toFixed(1));
}

function normalizeYearMonth(value) {
  const text = normalizeText(value, 10);

  if (!text) {
    return "";
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) {
    return "";
  }

  return text;
}

/*
 * =========================================
 * Search Name Normalization
 * =========================================
 *
 * normalizedName is used for searching and
 * duplicate prevention. It is not intended as
 * the user-facing display name.
 */

export function normalizeSkillNameForComparison(value) {
  return normalizeText(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[._/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * =========================================
 * Alias Normalization
 * =========================================
 */

function normalizeAliases(aliases, skillName = "") {
  if (!Array.isArray(aliases)) {
    return [];
  }

  const normalizedSkillName = normalizeSkillNameForComparison(skillName);

  const normalizedAliases = aliases
    .map((alias) => {
      if (typeof alias === "string") {
        return normalizeText(alias, SKILL_FIELD_LIMITS.alias);
      }

      return normalizeText(
        alias?.name || alias?.value || alias?.label,
        SKILL_FIELD_LIMITS.alias,
      );
    })
    .filter(Boolean);

  return normalizedAliases
    .filter((alias, index, collection) => {
      const comparisonName = normalizeSkillNameForComparison(alias);

      if (comparisonName === normalizedSkillName) {
        return false;
      }

      return (
        collection.findIndex(
          (candidate) =>
            normalizeSkillNameForComparison(candidate) === comparisonName,
        ) === index
      );
    })
    .slice(0, SKILL_FIELD_LIMITS.maximumAliases);
}

/*
 * =========================================
 * Empty Skill
 * =========================================
 */

export function createEmptySkill() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: SKILL_MODEL_VERSION,

    id: createSkillId(),

    name: "",

    normalizedName: "",

    category: DEFAULT_SKILL_VALUES.category,

    type: DEFAULT_SKILL_VALUES.type,

    description: "",

    aliases: [],

    proficiency: {
      level: DEFAULT_SKILL_VALUES.proficiency,

      yearsOfExperience: null,

      lastUsedDate: "",
    },

    language: {
      proficiency: DEFAULT_SKILL_VALUES.languageProficiency,
    },

    source: DEFAULT_SKILL_VALUES.source,

    /*
     * sourceContext describes where a skill was
     * created. Examples:
     *
     * skill-page
     * experience
     * resume
     * portfolio
     * ai-experience-suggestion
     */

    sourceContext: "",

    notes: "",

    status: DEFAULT_SKILL_VALUES.status,

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Normalize Skill
 * =========================================
 */

export function normalizeSkill(value = {}) {
  const defaults = createEmptySkill();

  /*
   * Permit a simple string during migration.
   */

  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  const proficiency =
    source.proficiency && typeof source.proficiency === "object"
      ? source.proficiency
      : {};

  const language =
    source.language && typeof source.language === "object"
      ? source.language
      : {};

  const name = normalizeText(
    source.name || source.label || source.value,
    SKILL_FIELD_LIMITS.name,
  );

  const category = isValidSkillCategory(source.category)
    ? source.category
    : defaults.category;

  const type = isValidSkillType(source.type) ? source.type : defaults.type;

  const proficiencyLevel = isValidSkillProficiency(proficiency.level)
    ? proficiency.level
    : defaults.proficiency.level;

  const languageProficiency = isValidLanguageProficiency(language.proficiency)
    ? language.proficiency
    : defaults.language.proficiency;

  const skillSource = isValidSkillSource(source.source)
    ? source.source
    : defaults.source;

  const status = isValidSkillStatus(source.status)
    ? source.status
    : defaults.status;

  return {
    modelVersion: SKILL_MODEL_VERSION,

    id: normalizeText(source.id, 200) || defaults.id,

    name,

    normalizedName: normalizeSkillNameForComparison(name),

    category,

    type,

    description: normalizeText(
      source.description,
      SKILL_FIELD_LIMITS.description,
    ),

    aliases: normalizeAliases(source.aliases, name),

    proficiency: {
      level: proficiencyLevel,

      yearsOfExperience: normalizeNullableNumber(
        proficiency.yearsOfExperience ?? source.yearsOfExperience,
      ),

      lastUsedDate: normalizeYearMonth(
        proficiency.lastUsedDate || source.lastUsedDate,
      ),
    },

    language: {
      proficiency: languageProficiency,
    },

    source: skillSource,

    sourceContext: normalizeText(source.sourceContext, 100),

    notes: normalizeText(source.notes, SKILL_FIELD_LIMITS.notes),

    status,

    createdAt: normalizeText(source.createdAt, 100) || defaults.createdAt,

    updatedAt: normalizeText(source.updatedAt, 100) || defaults.updatedAt,
  };
}

/*
 * =========================================
 * Create Skill
 * =========================================
 */

export function createSkill(values = {}) {
  const timestamp = new Date().toISOString();

  return normalizeSkill({
    ...values,

    id: normalizeText(values?.id, 200) || createSkillId(),

    createdAt: normalizeText(values?.createdAt, 100) || timestamp,

    updatedAt: timestamp,
  });
}

/*
 * =========================================
 * Update Skill
 * =========================================
 */

export function updateSkillModel(currentSkill, updates = {}) {
  return normalizeSkill({
    ...currentSkill,
    ...updates,

    proficiency: {
      ...currentSkill?.proficiency,
      ...updates?.proficiency,
    },

    language: {
      ...currentSkill?.language,
      ...updates?.language,
    },

    id: currentSkill?.id,

    createdAt: currentSkill?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Normalize Skill Collection
 * =========================================
 */

export function normalizeSkillCollection(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedSkills = values.map(normalizeSkill);

  /*
   * Remove duplicate IDs and duplicate skill names.
   */

  return normalizedSkills.filter((skill, index, collection) => {
    const duplicateIdIndex = collection.findIndex(
      (candidate) => candidate.id === skill.id,
    );

    const duplicateNameIndex = collection.findIndex(
      (candidate) =>
        candidate.normalizedName &&
        candidate.normalizedName === skill.normalizedName,
    );

    return (
      duplicateIdIndex === index &&
      (!skill.normalizedName || duplicateNameIndex === index)
    );
  });
}

/*
 * =========================================
 * Find Matching Skill
 * =========================================
 */

export function findMatchingSkill(skills, name) {
  if (!Array.isArray(skills)) {
    return null;
  }

  const normalizedName = normalizeSkillNameForComparison(name);

  if (!normalizedName) {
    return null;
  }

  return (
    skills.find((skill) => {
      if (normalizeSkillNameForComparison(skill.name) === normalizedName) {
        return true;
      }

      return (skill.aliases || []).some(
        (alias) => normalizeSkillNameForComparison(alias) === normalizedName,
      );
    }) || null
  );
}

/*
 * =========================================
 * Skill Display Information
 * =========================================
 */

export function getSkillDisplayName(skill) {
  return normalizeText(skill?.name) || "Unnamed Skill";
}

/*
 * =========================================
 * Public Skill
 * =========================================
 *
 * Private notes and internal source context are
 * excluded before public presentation.
 */

export function createPublicSkill(value) {
  const skill = normalizeSkill(value);

  const { notes, sourceContext, ...publicSkill } = skill;

  return publicSkill;
}
