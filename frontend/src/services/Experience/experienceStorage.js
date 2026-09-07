import {
  EXPERIENCE_MODEL_VERSION,
  normalizeExperienceCollection,
} from "../../models/experienceModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

const EXPERIENCE_STORAGE_KEY = "portfolio-platform:experiences";

const EXPERIENCE_STORAGE_VERSION = 1;

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createStorageError(message, publicMessage, cause) {
  const error = new Error(message);

  error.name = "ExperienceStorageError";
  error.code = "EXPERIENCE_STORAGE_ERROR";
  error.publicMessage = publicMessage;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/*
 * =========================================
 * Storage Availability
 * =========================================
 */

function getBrowserStorage() {
  if (typeof window === "undefined") {
    throw createStorageError(
      "Experience storage is unavailable outside the browser.",
      "Experience storage is currently unavailable.",
    );
  }

  if (!window.localStorage) {
    throw createStorageError(
      "The browser does not provide local storage.",
      "Your browser does not support local experience storage.",
    );
  }

  return window.localStorage;
}

/*
 * =========================================
 * Empty Storage Document
 * =========================================
 */

function createEmptyStorageDocument() {
  return {
    storageVersion: EXPERIENCE_STORAGE_VERSION,
    experienceModelVersion: EXPERIENCE_MODEL_VERSION,
    experiences: [],
    updatedAt: new Date().toISOString(),
  };
}

/*
 * =========================================
 * Parse Storage Document
 * =========================================
 */

function parseStorageDocument(value) {
  if (!value) {
    return createEmptyStorageDocument();
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(value);
  } catch (cause) {
    throw createStorageError(
      "Unable to parse stored experience data.",
      "The saved experience data could not be read.",
      cause,
    );
  }

  /*
   * Support an older format in which experiences
   * may have been saved as an array directly.
   */

  if (Array.isArray(parsedValue)) {
    return {
      ...createEmptyStorageDocument(),
      experiences: normalizeExperienceCollection(parsedValue),
    };
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    throw createStorageError(
      "The stored experience document has an invalid structure.",
      "The saved experience data has an invalid format.",
    );
  }

  return {
    storageVersion:
      Number(parsedValue.storageVersion) || EXPERIENCE_STORAGE_VERSION,

    experienceModelVersion:
      Number(parsedValue.experienceModelVersion) || EXPERIENCE_MODEL_VERSION,

    experiences: normalizeExperienceCollection(parsedValue.experiences),

    updatedAt:
      typeof parsedValue.updatedAt === "string"
        ? parsedValue.updatedAt
        : new Date().toISOString(),
  };
}

/*
 * =========================================
 * Read Storage Document
 * =========================================
 */

export function readExperienceStorage() {
  const storage = getBrowserStorage();

  try {
    const storedValue = storage.getItem(EXPERIENCE_STORAGE_KEY);

    return parseStorageDocument(storedValue);
  } catch (error) {
    if (error?.name === "ExperienceStorageError") {
      throw error;
    }

    throw createStorageError(
      "Unable to read experience storage.",
      "Your saved experiences could not be loaded.",
      error,
    );
  }
}

/*
 * =========================================
 * Write Storage Document
 * =========================================
 */

export function writeExperienceStorage(experiences) {
  const storage = getBrowserStorage();

  const storageDocument = {
    storageVersion: EXPERIENCE_STORAGE_VERSION,
    experienceModelVersion: EXPERIENCE_MODEL_VERSION,

    experiences: normalizeExperienceCollection(experiences),

    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(storageDocument));

    return storageDocument;
  } catch (error) {
    throw createStorageError(
      "Unable to write experience storage.",
      "Your experiences could not be saved in this browser.",
      error,
    );
  }
}

/*
 * =========================================
 * Read Experiences
 * =========================================
 */

export function readStoredExperiences() {
  return readExperienceStorage().experiences;
}

/*
 * =========================================
 * Replace Experiences
 * =========================================
 */

export function replaceStoredExperiences(experiences) {
  return writeExperienceStorage(experiences).experiences;
}

/*
 * =========================================
 * Clear Experience Storage
 * =========================================
 *
 * This is intentionally kept separate from normal
 * CRUD operations because it removes every saved
 * experience from this browser.
 */

export function clearExperienceStorage() {
  const storage = getBrowserStorage();

  try {
    storage.removeItem(EXPERIENCE_STORAGE_KEY);
  } catch (error) {
    throw createStorageError(
      "Unable to clear experience storage.",
      "The saved experience data could not be cleared.",
      error,
    );
  }
}

/*
 * =========================================
 * Storage Information
 * =========================================
 */

export function getExperienceStorageInformation() {
  const document = readExperienceStorage();

  return {
    storageKey: EXPERIENCE_STORAGE_KEY,
    storageVersion: document.storageVersion,
    experienceModelVersion: document.experienceModelVersion,
    experienceCount: document.experiences.length,
    updatedAt: document.updatedAt,
  };
}
