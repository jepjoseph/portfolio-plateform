import {
  createEmptySkill,
  createSkill as createSkillModel,
  findMatchingSkill,
  normalizeSkill,
  normalizeSkillCollection,
  normalizeSkillNameForComparison,
  updateSkillModel,
} from "../../models/skillModel.js";

import {
  assertValidSkill,
  validateSkill,
  validateSkillNameAvailability,
} from "./skillValidation.js";

import { readStoredSkills, replaceStoredSkills } from "./skillStorage.js";

/*
 * =========================================
 * Service Error
 * =========================================
 */

function createSkillServiceError({
  message,
  publicMessage,
  code,
  status = 500,
  details = null,
}) {
  const error = new Error(message);

  error.name = "SkillServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  error.details = details;

  return error;
}

function createSkillNotFoundError(skillId) {
  return createSkillServiceError({
    message: `Skill "${skillId}" was not found.`,
    publicMessage: "The requested skill could not be found.",
    code: "SKILL_NOT_FOUND",
    status: 404,
  });
}

/*
 * =========================================
 * Candidate Creation
 * =========================================
 *
 * Add defaults before validation without first
 * normalizing or truncating the supplied values.
 */

function createSkillCandidate(skillData = {}) {
  const defaults = createEmptySkill();

  return {
    ...defaults,
    ...skillData,

    proficiency: {
      ...defaults.proficiency,
      ...skillData.proficiency,
    },

    language: {
      ...defaults.language,
      ...skillData.language,
    },
  };
}

/*
 * =========================================
 * Get All Skills
 * =========================================
 */

export async function getSkills({
  includeArchived = false,
  category = "all",
  type = "all",
  query = "",
} = {}) {
  const skills = readStoredSkills();

  const normalizedQuery = normalizeSkillNameForComparison(query);

  return skills
    .filter((skill) => {
      if (!includeArchived && skill.status === "archived") {
        return false;
      }

      if (category !== "all" && skill.category !== category) {
        return false;
      }

      if (type !== "all" && skill.type !== type) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableValues = [
        skill.name,
        skill.description,
        skill.category,
        skill.type,
        ...(skill.aliases || []),
      ]
        .map(normalizeSkillNameForComparison)
        .filter(Boolean);

      return searchableValues.some((value) => value.includes(normalizedQuery));
    })
    .sort((firstSkill, secondSkill) =>
      firstSkill.name.localeCompare(secondSkill.name, undefined, {
        sensitivity: "base",
      }),
    );
}

/*
 * =========================================
 * Get Skill By ID
 * =========================================
 */

export async function getSkillById(skillId) {
  if (!skillId) {
    throw createSkillServiceError({
      message: "A skill ID is required to retrieve a skill.",
      publicMessage: "The requested skill could not be identified.",
      code: "SKILL_ID_REQUIRED",
      status: 400,
    });
  }

  const skills = readStoredSkills();

  const skill = skills.find((candidate) => candidate.id === skillId);

  if (!skill) {
    throw createSkillNotFoundError(skillId);
  }

  return skill;
}

/*
 * =========================================
 * Find Skill By Name or Alias
 * =========================================
 */

export async function findSkillByName(name) {
  if (!normalizeSkillNameForComparison(name)) {
    return null;
  }

  const skills = readStoredSkills();

  return findMatchingSkill(skills, name);
}

/*
 * =========================================
 * Create Skill
 * =========================================
 */

export async function createSkill(skillData) {
  const skills = readStoredSkills();

  const candidate = createSkillCandidate(skillData);

  assertValidSkill(candidate, {
    existingSkills: skills,
  });

  const skill = createSkillModel(candidate);

  const duplicateId = skills.some(
    (existingSkill) => existingSkill.id === skill.id,
  );

  if (duplicateId) {
    throw createSkillServiceError({
      message: `Skill ID "${skill.id}" already exists.`,
      publicMessage:
        "This skill could not be created because its identifier already exists.",
      code: "SKILL_ID_CONFLICT",
      status: 409,
    });
  }

  replaceStoredSkills([skill, ...skills]);

  return skill;
}

/*
 * =========================================
 * Update Skill
 * =========================================
 */

export async function updateSkill(skillId, updates = {}) {
  if (!skillId) {
    throw createSkillServiceError({
      message: "A skill ID is required to update a skill.",
      publicMessage: "The skill could not be identified.",
      code: "SKILL_ID_REQUIRED",
      status: 400,
    });
  }

  const skills = readStoredSkills();

  const skillIndex = skills.findIndex((skill) => skill.id === skillId);

  if (skillIndex === -1) {
    throw createSkillNotFoundError(skillId);
  }

  const currentSkill = skills[skillIndex];

  const mergedSkill = {
    ...currentSkill,
    ...updates,

    proficiency: {
      ...currentSkill.proficiency,
      ...updates.proficiency,
    },

    language: {
      ...currentSkill.language,
      ...updates.language,
    },

    id: currentSkill.id,
    createdAt: currentSkill.createdAt,
  };

  assertValidSkill(mergedSkill, {
    existingSkills: skills,
    excludeSkillId: skillId,
  });

  const updatedSkill = updateSkillModel(currentSkill, updates);

  const nextSkills = [...skills];

  nextSkills[skillIndex] = updatedSkill;

  replaceStoredSkills(nextSkills);

  return updatedSkill;
}

/*
 * =========================================
 * Archive Skill
 * =========================================
 */

export async function archiveSkill(skillId) {
  return updateSkill(skillId, {
    status: "archived",
  });
}

/*
 * =========================================
 * Restore Skill
 * =========================================
 */

export async function restoreSkill(skillId) {
  return updateSkill(skillId, {
    status: "active",
  });
}

/*
 * =========================================
 * Delete Skill
 * =========================================
 */

export async function deleteSkill(skillId) {
  if (!skillId) {
    throw createSkillServiceError({
      message: "A skill ID is required to delete a skill.",
      publicMessage: "The skill could not be identified.",
      code: "SKILL_ID_REQUIRED",
      status: 400,
    });
  }

  const skills = readStoredSkills();

  const skillToDelete = skills.find((skill) => skill.id === skillId);

  if (!skillToDelete) {
    throw createSkillNotFoundError(skillId);
  }

  const remainingSkills = skills.filter((skill) => skill.id !== skillId);

  replaceStoredSkills(remainingSkills);

  return {
    id: skillId,
    name: skillToDelete.name,
    deleted: true,
  };
}

/*
 * =========================================
 * Resolve Skill Match
 * =========================================
 */

export async function resolveSkillMatch(name) {
  const skills = readStoredSkills();

  const availability = validateSkillNameAvailability(name, skills);

  if (availability.isAvailable) {
    return {
      matched: false,
      matchedBy: "",
      skill: null,
    };
  }

  const matchingSkill = availability.matchingSkill;

  if (!matchingSkill) {
    return {
      matched: false,
      matchedBy: "",
      skill: null,
    };
  }

  const normalizedRequestedName = normalizeSkillNameForComparison(name);

  const normalizedPrimaryName = normalizeSkillNameForComparison(
    matchingSkill.name,
  );

  return {
    matched: true,

    matchedBy:
      normalizedRequestedName === normalizedPrimaryName ? "name" : "alias",

    skill: matchingSkill,
  };
}

/*
 * =========================================
 * Find or Create Skill
 * =========================================
 *
 * This is the main operation used by
 * ExperienceSkillsEditor.
 */

export async function findOrCreateSkill(
  skillData,
  { restoreArchived = true } = {},
) {
  const candidateData =
    typeof skillData === "string"
      ? {
          name: skillData,
        }
      : skillData || {};

  const name =
    typeof candidateData.name === "string" ? candidateData.name.trim() : "";

  if (!name) {
    throw createSkillServiceError({
      message: "A skill name is required for find-or-create.",
      publicMessage: "Enter a skill name before adding it.",
      code: "SKILL_NAME_REQUIRED",
      status: 400,
    });
  }

  const matchResult = await resolveSkillMatch(name);

  if (matchResult.matched) {
    let matchedSkill = matchResult.skill;
    let restored = false;

    if (restoreArchived && matchedSkill.status === "archived") {
      matchedSkill = await restoreSkill(matchedSkill.id);

      restored = true;
    }

    return {
      skill: matchedSkill,
      created: false,
      restored,
      matched: true,
      matchedBy: matchResult.matchedBy,
    };
  }

  const createdSkill = await createSkill({
    ...candidateData,

    name,

    source: candidateData.source || "manual",

    sourceContext: candidateData.sourceContext || "experience",
  });

  return {
    skill: createdSkill,
    created: true,
    restored: false,
    matched: false,
    matchedBy: "",
  };
}

/*
 * =========================================
 * Validate Skill Draft
 * =========================================
 */

export async function validateSkillDraft(
  skillData,
  { excludeSkillId = "" } = {},
) {
  const existingSkills = readStoredSkills();

  const candidate = createSkillCandidate(skillData);

  return validateSkill(candidate, {
    existingSkills,
    excludeSkillId,
  });
}

/*
 * =========================================
 * Validate Name Availability
 * =========================================
 */

export async function checkSkillNameAvailability(
  name,
  { excludeSkillId = "" } = {},
) {
  const existingSkills = readStoredSkills();

  return validateSkillNameAvailability(name, existingSkills, excludeSkillId);
}

/*
 * =========================================
 * Replace Skill Library
 * =========================================
 *
 * Used for future imports and migrations.
 */

export async function replaceSkills(skillValues) {
  if (!Array.isArray(skillValues)) {
    throw createSkillServiceError({
      message: "The replacement Skill Library must be an array.",
      publicMessage: "The Skill Library has an invalid format.",
      code: "INVALID_SKILL_COLLECTION",
      status: 400,
    });
  }

  const validatedSkills = [];

  skillValues.forEach((skillValue, index) => {
    const candidate = createSkillCandidate(skillValue);

    const otherSkills = skillValues.filter(
      (_, candidateIndex) => candidateIndex !== index,
    );

    assertValidSkill(candidate, {
      existingSkills: otherSkills,
      excludeSkillId: candidate.id,
    });

    validatedSkills.push(normalizeSkill(candidate));
  });

  const normalizedSkills = normalizeSkillCollection(validatedSkills);

  return replaceStoredSkills(normalizedSkills);
}
