import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "../apiClient.js";

import {
  prepareExperienceApiPayload,
  getExperienceRowVersion,
} from "./experienceApiAdapter.js";

const EXPERIENCE_ENDPOINT = "/experiences";

function experiencePath(experienceId) {
  if (
    typeof experienceId !== "string" ||
    !experienceId.trim() ||
    experienceId.trim().length > 200
  ) {
    throw new TypeError("A valid Experience ID is required.");
  }

  return `${EXPERIENCE_ENDPOINT}/${encodeURIComponent(
    experienceId.trim(),
  )}`;
}

function requireRowVersion(rowVersion) {
  return getExperienceRowVersion({ rowVersion });
}

export async function fetchExperiences(options = {}) {
  const response = await apiGet(EXPERIENCE_ENDPOINT, options);

  return response.data.experiences;
}

export async function fetchExperienceById(
  experienceId,
  options = {},
) {
  const response = await apiGet(
    experiencePath(experienceId),
    options,
  );

  return response.data.experience;
}

export async function createExperienceApi(
  experience,
  options = {},
) {
  const response = await apiPost(
    EXPERIENCE_ENDPOINT,
    prepareExperienceApiPayload(experience),
    options,
  );

  return response.data.experience;
}

export async function updateExperienceApi(
  experienceId,
  experience,
  rowVersion,
  options = {},
) {
  const response = await apiPut(
    experiencePath(experienceId),
    {
      experience: prepareExperienceApiPayload(experience),
      rowVersion: requireRowVersion(rowVersion),
    },
    options,
  );

  return response.data.experience;
}

export async function setExperienceArchivedApi(
  experienceId,
  archived,
  rowVersion,
  options = {},
) {
  if (typeof archived !== "boolean") {
    throw new TypeError("archived must be a boolean.");
  }

  const response = await apiPatch(
    `${experiencePath(experienceId)}/archive`,
    {
      archived,
      rowVersion: requireRowVersion(rowVersion),
    },
    options,
  );

  return response.data.experience;
}

export async function deleteExperienceApi(
  experienceId,
  rowVersion,
  options = {},
) {
  const response = await apiDelete(
    experiencePath(experienceId),
    {
      ...options,
      body: {
        rowVersion: requireRowVersion(rowVersion),
      },
    },
  );

  return response.data;
}