import {
  createEmptySkill,
  createSkill as createSkillModel,
  findMatchingSkill,
  normalizeSkill,
  normalizeSkillCollection,
  normalizeSkillNameForComparison,
  updateSkillModel,
} from "../../models/skillModel.js";

import { readStoredExperiences } from "../Experience/experienceStorage.js";

import { readStoredEducation } from "../Education/educationStorage.js";

import { readStoredTraining } from "../Training/trainingStorage.js";

import { getSkillUsage } from "./skillUtils.js";

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
  conflicts = [],
  usage = null,
}) {
  const error = new Error(message);

  error.name = "SkillServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  error.details = details;

  error.conflicts = Array.isArray(conflicts) ? conflicts : [];

  error.usage = usage && typeof usage === "object" ? usage : null;

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
 * Skill Usage Conflict
 * =========================================
 */

function createSkillUsageConflict(skill, usage) {
  const experienceCount = Number(usage?.experienceCount) || 0;

  const educationCount = Number(usage?.educationCount) || 0;

  const trainingCount = Number(usage?.trainingCount) || 0;

  const resumeCount = Number(usage?.resumeCount) || 0;

  const portfolioCount = Number(usage?.portfolioCount) || 0;

  const experienceSkillCount = Number(usage?.experienceSkillCount) || 0;

  const experienceTechnologyCount =
    Number(usage?.experienceTechnologyCount) || 0;

  const educationSkillCount = Number(usage?.educationSkillCount) || 0;

  const trainingSkillCount = Number(usage?.trainingSkillCount) || 0;

  const relationshipCount =
    experienceSkillCount +
    experienceTechnologyCount +
    educationSkillCount +
    trainingSkillCount;

  const recordCount =
    experienceCount +
    educationCount +
    trainingCount +
    resumeCount +
    portfolioCount;

  const publicMessage =
    `"${skill.name}" cannot be permanently deleted because it is still ` +
    `referenced by ${recordCount} ${
      recordCount === 1 ? "saved record" : "saved records"
    }. Archive it instead.`;

  const experienceConflicts = Array.isArray(usage?.experiences)
    ? usage.experiences.map((experience) => ({
        type: "experience",

        recordId: experience.id,

        recordName:
          `${experience.positionTitle} at ` + experience.organizationName,

        positionTitle: experience.positionTitle,

        organizationName: experience.organizationName,

        usedAsSkill: experience.usedAsSkill === true,

        usedAsTechnology: experience.usedAsTechnology === true,
      }))
    : [];

  const educationConflicts = Array.isArray(usage?.educationRecords)
    ? usage.educationRecords.map((education) => ({
        type: "education",

        recordId: education.id,

        recordName:
          `${education.credentialName} at ` + education.institutionName,

        credentialName: education.credentialName,

        institutionName: education.institutionName,
      }))
    : [];

  const trainingConflicts = Array.isArray(usage?.trainingRecords)
    ? usage.trainingRecords.map((training) => ({
        type: "training",

        recordId: training.id,

        recordName: `${training.title} from ` + training.providerName,

        title: training.title,

        providerName: training.providerName,
      }))
    : [];

  return createSkillServiceError({
    message:
      `Skill "${skill.id}" has stored relationships ` +
      "and cannot be deleted.",

    publicMessage,

    code: "SKILL_IN_USE",

    status: 409,

    details: {
      skillId: skill.id,
      skillName: skill.name,

      recordCount,
      relationshipCount,

      experienceCount,
      educationCount,
      trainingCount,
      resumeCount,
      portfolioCount,

      experienceSkillCount,
      experienceTechnologyCount,
      educationSkillCount,
      trainingSkillCount,
    },

    usage,

    conflicts: [
      ...experienceConflicts,
      ...educationConflicts,
      ...trainingConflicts,
    ],
  });
}

/*
 * =========================================
 * Candidate Creation
 * =========================================
 */

function createSkillCandidate(skillData = {}) {
  const defaults = createEmptySkill();

  const source = skillData && typeof skillData === "object" ? skillData : {};

  return {
    ...defaults,
    ...source,

    proficiency: {
      ...defaults.proficiency,
      ...source.proficiency,
    },

    language: {
      ...defaults.language,
      ...source.language,
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

  return findMatchingSkill(readStoredSkills(), name);
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

  const safeUpdates = updates && typeof updates === "object" ? updates : {};

  const mergedSkill = {
    ...currentSkill,
    ...safeUpdates,

    proficiency: {
      ...currentSkill.proficiency,
      ...safeUpdates.proficiency,
    },

    language: {
      ...currentSkill.language,
      ...safeUpdates.language,
    },

    id: currentSkill.id,

    createdAt: currentSkill.createdAt,
  };

  assertValidSkill(mergedSkill, {
    existingSkills: skills,
    excludeSkillId: skillId,
  });

  const updatedSkill = updateSkillModel(currentSkill, safeUpdates);

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
  /*
   * Archiving is allowed even when the skill is
   * referenced. Experience, Education, and Training
   * relationships preserve readable snapshots.
   */

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
 * Resolve Stored Usage
 * =========================================
 */

function resolveStoredSkillUsage(skillId) {
  /*
   * Active and archived parent records are checked.
   * Archiving a parent record does not remove its
   * central Skill Library relationships.
   */

  const experiences = readStoredExperiences();

  const educationRecords = readStoredEducation();

  const trainingRecords = readStoredTraining();

  return getSkillUsage(skillId, {
    experiences,
    educationRecords,
    trainingRecords,
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

  /*
 * The service independently reads Experience,
 * Education, and Training storage. Deletion
 * protection cannot be bypassed by calling
 * skillService directly.
 */

  const usage = resolveStoredSkillUsage(skillId);

  if (Number(usage.total ?? usage.totalUsage) > 0) {
    throw createSkillUsageConflict(skillToDelete, usage);
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

  if (availability.isAvailable || !availability.matchingSkill) {
    return {
      matched: false,
      matchedBy: "",
      skill: null,
    };
  }

  const matchingSkill = availability.matchingSkill;

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
      : skillData && typeof skillData === "object"
        ? skillData
        : {};

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
  return validateSkillNameAvailability(
    name,
    readStoredSkills(),
    excludeSkillId,
  );
}

/*
 * =========================================
 * Replace Skill Library
 * =========================================
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
