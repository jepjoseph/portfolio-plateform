import {
  fetchExperiences,
  fetchExperienceById,
  createExperienceApi,
  updateExperienceApi,
  setExperienceArchivedApi,
  deleteExperienceApi,
} from "./experienceApiService.js";

import {
  validateExperience,
} from "./experienceValidation.js";

import {
  getExperienceRowVersion,
} from "./experienceApiAdapter.js";

/*
 * Database-backed Experience service.
 *
 * Not activated in ExperienceDataContext yet.
 * Never reads or writes browser localStorage.
 */

function requireExperience(experience) {
  if (
    !experience ||
    typeof experience !== "object" ||
    Array.isArray(experience)
  ) {
    throw new TypeError("A complete Experience record is required.");
  }

  return experience;
}

function requireVersion(experience) {
  return getExperienceRowVersion(requireExperience(experience));
}

function requireMatchingId(experienceId, experience) {
  requireExperience(experience);

  if (experience.id !== experienceId) {
    throw new TypeError("Experience ID does not match the record.");
  }
}

export async function getExperiences({
  includeArchived = false,
} = {}) {
  const experiences = await fetchExperiences();

  if (!Array.isArray(experiences)) {
    throw new TypeError("The Experience API returned an invalid collection.");
  }

  return includeArchived
    ? experiences
    : experiences.filter((item) => item.status !== "archived");
}

export async function getExperienceById(experienceId) {
  return fetchExperienceById(experienceId);
}

export async function createExperience(experienceData) {
  requireExperience(experienceData);

  return createExperienceApi(experienceData);
}

/*
 * Updates require a complete record with the
 * rowVersion originally loaded by the client.
 *
 * No automatic conflict retries.
 */
export async function updateExperience(
  experienceId,
  experience,
) {
  requireMatchingId(experienceId, experience);

  const rowVersion = requireVersion(experience);

  return updateExperienceApi(
    experienceId,
    experience,
    rowVersion,
  );
}

export async function archiveExperience(
  experienceId,
  experience,
) {
  requireMatchingId(experienceId, experience);

  return setExperienceArchivedApi(
    experienceId,
    true,
    requireVersion(experience),
  );
}

export async function restoreExperience(
  experienceId,
  experience,
) {
  requireMatchingId(experienceId, experience);

  return setExperienceArchivedApi(
    experienceId,
    false,
    requireVersion(experience),
  );
}

export async function deleteExperience(
  experienceId,
  experience,
) {
  requireMatchingId(experienceId, experience);

  return deleteExperienceApi(
    experienceId,
    requireVersion(experience),
  );
}

export async function validateExperienceDraft(experienceData) {
  return validateExperience(experienceData);
}