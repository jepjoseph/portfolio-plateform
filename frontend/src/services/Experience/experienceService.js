import {
  createExperience as createExperienceModel,
  normalizeExperience,
  updateExperienceModel,
} from "../../models/experienceModel.js";

import {
  assertValidExperience,
  validateExperience,
} from "./experienceValidation.js";

import {
  readStoredExperiences,
  replaceStoredExperiences,
} from "./experienceStorage.js";

/*
 * =========================================
 * Service Errors
 * =========================================
 */

function createServiceError({ message, publicMessage, code, status = 500 }) {
  const error = new Error(message);

  error.name = "ExperienceServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;

  return error;
}

function createNotFoundError(experienceId) {
  return createServiceError({
    message: `Experience "${experienceId}" was not found.`,
    publicMessage: "The requested experience could not be found.",
    code: "EXPERIENCE_NOT_FOUND",
    status: 404,
  });
}

/*
 * =========================================
 * Simulated Async Operation
 * =========================================
 *
 * The service methods are asynchronous now so
 * components will not need to change when these
 * operations become real API requests.
 */

function resolveAsync(value) {
  return Promise.resolve(value);
}

/*
 * =========================================
 * Get All Experiences
 * =========================================
 */

export async function getExperiences({ includeArchived = false } = {}) {
  const experiences = readStoredExperiences();

  const filteredExperiences = includeArchived
    ? experiences
    : experiences.filter((experience) => experience.status !== "archived");

  return resolveAsync(filteredExperiences);
}

/*
 * =========================================
 * Get Experience By ID
 * =========================================
 */

export async function getExperienceById(experienceId) {
  if (!experienceId) {
    throw createServiceError({
      message: "An experience ID is required to retrieve an experience.",
      publicMessage: "The requested experience could not be identified.",
      code: "EXPERIENCE_ID_REQUIRED",
      status: 400,
    });
  }

  const experiences = readStoredExperiences();

  const experience = experiences.find((item) => item.id === experienceId);

  if (!experience) {
    throw createNotFoundError(experienceId);
  }

  return resolveAsync(experience);
}

/*
 * =========================================
 * Create Experience
 * =========================================
 */

export async function createExperience(experienceData) {
  /*
   * Validate before normalization so invalid or
   * oversized input is not silently truncated.
   */

  assertValidExperience(experienceData);

  const experiences = readStoredExperiences();

  const experience = createExperienceModel(experienceData);

  const duplicateId = experiences.some((item) => item.id === experience.id);

  if (duplicateId) {
    throw createServiceError({
      message: `Experience ID "${experience.id}" already exists.`,
      publicMessage:
        "This experience could not be created because its identifier already exists.",
      code: "EXPERIENCE_ID_CONFLICT",
      status: 409,
    });
  }

  replaceStoredExperiences([experience, ...experiences]);

  return resolveAsync(experience);
}

/*
 * =========================================
 * Update Experience
 * =========================================
 */

export async function updateExperience(experienceId, updates) {
  if (!experienceId) {
    throw createServiceError({
      message: "An experience ID is required to update an experience.",
      publicMessage: "The experience could not be identified.",
      code: "EXPERIENCE_ID_REQUIRED",
      status: 400,
    });
  }

  const experiences = readStoredExperiences();

  const experienceIndex = experiences.findIndex(
    (experience) => experience.id === experienceId,
  );

  if (experienceIndex === -1) {
    throw createNotFoundError(experienceId);
  }

  const currentExperience = experiences[experienceIndex];

  /*
   * Merge the record before validating it because
   * updates may include only part of the model.
   */

  const mergedExperience = {
    ...currentExperience,
    ...updates,

    position: {
      ...currentExperience.position,
      ...updates?.position,
    },

    organization: {
      ...currentExperience.organization,
      ...updates?.organization,
    },

    location: {
      ...currentExperience.location,
      ...updates?.location,
    },

    dates: {
      ...currentExperience.dates,
      ...updates?.dates,
    },

    leadership: {
      ...currentExperience.leadership,
      ...updates?.leadership,
    },

    privateInformation: {
      ...currentExperience.privateInformation,
      ...updates?.privateInformation,
    },

    visibility: {
      ...currentExperience.visibility,
      ...updates?.visibility,
    },
  };

  assertValidExperience(mergedExperience);

  const updatedExperience = updateExperienceModel(currentExperience, updates);

  const nextExperiences = [...experiences];

  nextExperiences[experienceIndex] = updatedExperience;

  replaceStoredExperiences(nextExperiences);

  return resolveAsync(updatedExperience);
}

/*
 * =========================================
 * Archive Experience
 * =========================================
 */

export async function archiveExperience(experienceId) {
  return updateExperience(experienceId, {
    status: "archived",
  });
}

/*
 * =========================================
 * Restore Experience
 * =========================================
 */

export async function restoreExperience(experienceId) {
  return updateExperience(experienceId, {
    status: "active",
  });
}

/*
 * =========================================
 * Delete Experience
 * =========================================
 */

export async function deleteExperience(experienceId) {
  if (!experienceId) {
    throw createServiceError({
      message: "An experience ID is required to delete an experience.",
      publicMessage: "The experience could not be identified.",
      code: "EXPERIENCE_ID_REQUIRED",
      status: 400,
    });
  }

  const experiences = readStoredExperiences();

  const experienceToDelete = experiences.find(
    (experience) => experience.id === experienceId,
  );

  if (!experienceToDelete) {
    throw createNotFoundError(experienceId);
  }

  const remainingExperiences = experiences.filter(
    (experience) => experience.id !== experienceId,
  );

  replaceStoredExperiences(remainingExperiences);

  return resolveAsync({
    id: experienceId,
    deleted: true,
  });
}

/*
 * =========================================
 * Validate Without Saving
 * =========================================
 */

export async function validateExperienceDraft(experienceData) {
  return resolveAsync(validateExperience(experienceData));
}

/*
 * =========================================
 * Replace Collection
 * =========================================
 *
 * This is useful for future imports and migration.
 * It should not normally be called from the form.
 */

export async function replaceExperiences(experienceValues) {
  if (!Array.isArray(experienceValues)) {
    throw createServiceError({
      message: "The replacement experience collection must be an array.",
      publicMessage: "The experience collection has an invalid format.",
      code: "INVALID_EXPERIENCE_COLLECTION",
      status: 400,
    });
  }

  const normalizedExperiences = experienceValues.map((experience) => {
    assertValidExperience(experience);

    return normalizeExperience(experience);
  });

  const savedExperiences = replaceStoredExperiences(normalizedExperiences);

  return resolveAsync(savedExperiences);
}
