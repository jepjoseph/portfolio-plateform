import {
  fetchSkills,
  fetchSkillById,
  createSkillApi,
  updateSkillApi,
  archiveSkillApi,
  restoreSkillApi,
} from "./skillApiService.js";

import {
  createEmptySkill,
  findMatchingSkill,
  normalizeSkillNameForComparison,
} from "../../models/skillModel.js";

import {
  validateSkill,
  validateSkillNameAvailability,
} from "./skillValidation.js";

function makeError(message, code, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.publicMessage = message;
  return error;
}

function requireVersion(skill) {
  if (!skill?.rowVersion) {
    throw makeError(
      "The skill must be refreshed before it can be changed.",
      "SKILL_ROW_VERSION_REQUIRED",
      409,
    );
  }

  return skill.rowVersion;
}

function assertSkillCollection(skills) {
  if (!Array.isArray(skills)) {
    throw makeError(
      "The server returned an invalid Skill Library.",
      "SKILL_RESPONSE_INVALID",
      502,
    );
  }

  const ids = new Set();

  for (const skill of skills) {
    if (
      !skill ||
      typeof skill.id !== "string" ||
      typeof skill.name !== "string" ||
      typeof skill.rowVersion !== "string" ||
      !skill.rowVersion.trim() ||
      ids.has(skill.id)
    ) {
      throw makeError(
        "The server returned an invalid or duplicate Skill.",
        "SKILL_RESPONSE_INVALID",
        502,
      );
    }

    ids.add(skill.id);
  }

  return skills;
}

export async function getSkills({
  includeArchived = false,
  category = "all",
  type = "all",
  query = "",
} = {}) {
  const skills = assertSkillCollection(
    await fetchSkills({
      query: { includeArchived: true },
    }),
  );

  const search = normalizeSkillNameForComparison(query);

  return skills.filter((skill) => {
    if (!includeArchived && skill.status === "archived") return false;
    if (category !== "all" && skill.category !== category) return false;
    if (type !== "all" && skill.type !== type) return false;

    if (!search) return true;

    return [
      skill.name,
      skill.description,
      skill.category,
      skill.type,
      ...(skill.aliases || []),
    ].some((value) =>
      normalizeSkillNameForComparison(value).includes(search),
    );
  });
}

export async function getSkillById(skillId) {
  return fetchSkillById(skillId);
}

export async function createSkill(skillData) {
  return createSkillApi(skillData);
}

export async function updateSkill(skillId, updates = {}) {
  const current = await getSkillById(skillId);

  return updateSkillApi(
    skillId,
    updates,
    requireVersion(current),
  );
}

export async function archiveSkill(skillId) {
  const current = await getSkillById(skillId);

  return archiveSkillApi(skillId, requireVersion(current));
}

export async function restoreSkill(skillId) {
  const current = await getSkillById(skillId);

  return restoreSkillApi(skillId, requireVersion(current));
}

export async function resolveSkillMatch(name) {
  const skills = await getSkills({ includeArchived: true });
  const matchingSkill = findMatchingSkill(skills, name);

  if (!matchingSkill) {
    return {
      matched: false,
      matchedBy: "",
      skill: null,
    };
  }

  const requested = normalizeSkillNameForComparison(name);
  const primary = normalizeSkillNameForComparison(matchingSkill.name);

  return {
    matched: true,
    matchedBy: requested === primary ? "name" : "alias",
    skill: matchingSkill,
  };
}

export async function findOrCreateSkill(
  skillData,
  { restoreArchived = true } = {},
) {
  const candidate =
    typeof skillData === "string"
      ? { name: skillData }
      : skillData && typeof skillData === "object"
        ? skillData
        : {};

  const name = String(candidate.name || "").trim();

  if (!name) {
    throw makeError("Enter a skill name.", "SKILL_NAME_REQUIRED");
  }

  const match = await resolveSkillMatch(name);

  if (match.matched) {
    const restored =
      restoreArchived && match.skill.status === "archived";

    const skill = restored
      ? await restoreSkill(match.skill.id)
      : match.skill;

    return {
      skill,
      created: false,
      restored,
      matched: true,
      matchedBy: match.matchedBy,
    };
  }

  const skill = await createSkill({
    ...candidate,
    name,
    source: candidate.source || "manual",
    sourceContext: candidate.sourceContext || "experience",
  });

  return {
    skill,
    created: true,
    restored: false,
    matched: false,
    matchedBy: "",
  };
}

export async function validateSkillDraft(
  skillData,
  { excludeSkillId = "" } = {},
) {
  const skills = await getSkills({ includeArchived: true });

  const defaults = createEmptySkill();

  const candidate = {
    ...defaults,
    ...skillData,
    proficiency: {
      ...defaults.proficiency,
      ...skillData?.proficiency,
    },
    language: {
      ...defaults.language,
      ...skillData?.language,
    },
  };

  return validateSkill(candidate, {
    existingSkills: skills,
    excludeSkillId,
  });
}

export async function checkSkillNameAvailability(
  name,
  { excludeSkillId = "" } = {},
) {
  const skills = await getSkills({ includeArchived: true });

  return validateSkillNameAvailability(
    name,
    skills,
    excludeSkillId,
  );
}

export async function deleteSkill() {
  throw makeError(
    "Permanent Skill deletion is not available. Archive the skill instead.",
    "SKILL_DELETE_NOT_AVAILABLE",
    409,
  );
}

export async function replaceSkills() {
  throw makeError(
    "Replacing the entire Skill Library is not supported by the backend.",
    "SKILL_REPLACE_NOT_AVAILABLE",
    409,
  );
}