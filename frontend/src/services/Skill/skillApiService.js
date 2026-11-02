import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "../apiClient.js";

const SKILLS_ENDPOINT = "/skills";

function skillPath(skillId) {
  if (
    typeof skillId !== "string" ||
    !skillId.trim() ||
    skillId.trim().length > 200
  ) {
    throw new TypeError("A valid Skill ID is required.");
  }

  return `${SKILLS_ENDPOINT}/${encodeURIComponent(skillId.trim())}`;
}

function requireRowVersion(rowVersion) {
  if (typeof rowVersion !== "string" || !rowVersion.trim()) {
    throw new TypeError("A Skill rowVersion is required.");
  }

  return rowVersion.trim();
}

function requireSkillData(skillData) {
  if (
    !skillData ||
    typeof skillData !== "object" ||
    Array.isArray(skillData)
  ) {
    throw new TypeError("Skill data must be an object.");
  }

  return skillData;
}

function requireUpdates(updates) {
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    throw new TypeError("Skill updates must be an object.");
  }

  return updates;
}

export async function fetchSkills(options = {}) {
  const response = await apiGet(SKILLS_ENDPOINT, options);
  return response.data.skills;
}

export async function fetchSkillById(skillId, options = {}) {
  const response = await apiGet(skillPath(skillId), options);
  return response.data.skill;
}

export async function createSkillApi(skillData, options = {}) {
  const response = await apiPost(
    SKILLS_ENDPOINT,
    requireSkillData(skillData),
    options,
  );

  return response.data.skill;
}

export async function updateSkillApi(
  skillId,
  updates,
  rowVersion,
  options = {},
) {
  const response = await apiPatch(
    skillPath(skillId),
    {
      updates: requireUpdates(updates),
      rowVersion: requireRowVersion(rowVersion),
    },
    options,
  );

  return response.data.skill;
}

export async function setSkillArchivedApi(
  skillId,
  archived,
  rowVersion,
  options = {},
) {
  if (typeof archived !== "boolean") {
    throw new TypeError("archived must be a boolean.");
  }

  const response = await apiPatch(
    `${skillPath(skillId)}/archive`,
    {
      archived,
      rowVersion: requireRowVersion(rowVersion),
    },
    options,
  );

  return response.data.skill;
}

export function archiveSkillApi(
  skillId,
  rowVersion,
  options = {},
) {
  return setSkillArchivedApi(
    skillId,
    true,
    rowVersion,
    options,
  );
}

export function restoreSkillApi(
  skillId,
  rowVersion,
  options = {},
) {
  return setSkillArchivedApi(
    skillId,
    false,
    rowVersion,
    options,
  );
}

export async function deleteSkillApi(
  skillId,
  rowVersion,
  options = {},
) {
  const response = await apiDelete(skillPath(skillId), {
    ...options,
    body: {
      rowVersion: requireRowVersion(rowVersion),
    },
  });

  return response.data;
}