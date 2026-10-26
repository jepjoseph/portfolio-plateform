import { updateExperienceModel } from "../../models/experienceModel.js";
import { assertValidExperience } from "./experienceValidation.js";
import { getExperienceRowVersion } from "./experienceApiAdapter.js";

import * as database from "./experienceDatabaseService.js";

/*
 * Compatibility layer for the existing React Experience context.
 *
 * Not connected to ExperienceDataContext yet.
 * Does not access localStorage.
 *
 * The caller supplies the collection currently loaded by React.
 * Its rowVersion is deliberately used without refreshing it first,
 * so stale writes produce a concurrency conflict.
 */

function requireCollection(experiences) {
  if (!Array.isArray(experiences)) {
    throw new TypeError("The loaded Experience collection is required.");
  }

  return experiences;
}

function findLoadedExperience(experiences, experienceId) {
  const collection = requireCollection(experiences);

  const experience = collection.find(
    (item) => item?.id === experienceId,
  );

  if (!experience) {
    const error = new Error("The requested Experience is not loaded.");

    error.name = "ExperienceServiceError";
    error.code = "EXPERIENCE_NOT_LOADED";
    error.status = 404;

    throw error;
  }

  getExperienceRowVersion(experience);

  return experience;
}

function requireUpdates(updates) {
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    throw new TypeError("Experience updates must be an object.");
  }

  if (
    Object.hasOwn(updates, "id") ||
    Object.hasOwn(updates, "rowVersion") ||
    Object.hasOwn(updates, "createdAt") ||
    Object.hasOwn(updates, "updatedAt")
  ) {
    throw new TypeError(
      "Experience updates cannot override server-owned fields.",
    );
  }

  return updates;
}

export async function getExperiences(options = {}) {
  return database.getExperiences(options);
}

export async function getExperienceById(experienceId) {
  return database.getExperienceById(experienceId);
}

export async function createExperience(experienceData) {
  assertValidExperience(experienceData);

  return database.createExperience(experienceData);
}

export async function updateExperience(
  experiences,
  experienceId,
  updates,
) {
  const current = findLoadedExperience(experiences, experienceId);

  requireUpdates(updates);

  const updated = updateExperienceModel(current, updates);

  assertValidExperience(updated);

  return database.updateExperience(experienceId, updated);
}

export async function archiveExperience(experiences, experienceId) {
  const current = findLoadedExperience(experiences, experienceId);

  return database.archiveExperience(experienceId, current);
}

export async function restoreExperience(experiences, experienceId) {
  const current = findLoadedExperience(experiences, experienceId);

  return database.restoreExperience(experienceId, current);
}

export async function deleteExperience(experiences, experienceId) {
  const current = findLoadedExperience(experiences, experienceId);

  return database.deleteExperience(experienceId, current);
}

export async function validateExperienceDraft(experienceData) {
  return database.validateExperienceDraft(experienceData);
}