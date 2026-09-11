import {
  EDUCATION_MODEL_VERSION,
  normalizeEducationCollection,
} from "../../models/educationModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

export const EDUCATION_STORAGE_KEY = "portfolio-platform:education";

const EDUCATION_STORAGE_VERSION = 1;

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createEducationStorageError(message, publicMessage, cause) {
  const error = new Error(message);

  error.name = "EducationStorageError";

  error.code = "EDUCATION_STORAGE_ERROR";

  error.publicMessage = publicMessage;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/*
 * =========================================
 * Browser Storage
 * =========================================
 */

function getBrowserStorage() {
  if (typeof window === "undefined") {
    throw createEducationStorageError(
      "Education storage is unavailable outside the browser.",
      "Education storage is currently unavailable.",
    );
  }

  if (!window.localStorage) {
    throw createEducationStorageError(
      "The browser does not provide local storage.",
      "Your browser does not support local education storage.",
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
    storageVersion: EDUCATION_STORAGE_VERSION,

    educationModelVersion: EDUCATION_MODEL_VERSION,

    educationRecords: [],

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
    throw createEducationStorageError(
      "Unable to parse stored education data.",
      "The saved education data could not be read.",
      cause,
    );
  }

  /*
   * Support legacy storage containing the
   * collection directly as an array.
   */

  if (Array.isArray(parsedValue)) {
    return {
      ...createEmptyStorageDocument(),

      educationRecords: normalizeEducationCollection(parsedValue),
    };
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    throw createEducationStorageError(
      "The stored education document has an invalid structure.",
      "The saved education data has an invalid format.",
    );
  }

  return {
    storageVersion:
      Number(parsedValue.storageVersion) || EDUCATION_STORAGE_VERSION,

    educationModelVersion:
      Number(parsedValue.educationModelVersion) || EDUCATION_MODEL_VERSION,

    educationRecords: normalizeEducationCollection(
      parsedValue.educationRecords ||
        parsedValue.education ||
        parsedValue.records,
    ),

    updatedAt:
      typeof parsedValue.updatedAt === "string"
        ? parsedValue.updatedAt
        : new Date().toISOString(),
  };
}

/*
 * =========================================
 * Read Storage
 * =========================================
 */

export function readEducationStorage() {
  const storage = getBrowserStorage();

  try {
    const storedValue = storage.getItem(EDUCATION_STORAGE_KEY);

    return parseStorageDocument(storedValue);
  } catch (error) {
    if (error?.name === "EducationStorageError") {
      throw error;
    }

    throw createEducationStorageError(
      "Unable to read education storage.",
      "Your saved education records could not be loaded.",
      error,
    );
  }
}

/*
 * =========================================
 * Write Storage
 * =========================================
 */

export function writeEducationStorage(educationRecords) {
  const storage = getBrowserStorage();

  const document = {
    storageVersion: EDUCATION_STORAGE_VERSION,

    educationModelVersion: EDUCATION_MODEL_VERSION,

    educationRecords: normalizeEducationCollection(educationRecords),

    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(EDUCATION_STORAGE_KEY, JSON.stringify(document));

    return document;
  } catch (error) {
    throw createEducationStorageError(
      "Unable to write education storage.",
      "Your education records could not be saved in this browser.",
      error,
    );
  }
}

/*
 * =========================================
 * Collection Operations
 * =========================================
 */

export function readStoredEducation() {
  return readEducationStorage().educationRecords;
}

export function replaceStoredEducation(educationRecords) {
  return writeEducationStorage(educationRecords).educationRecords;
}

export function updateStoredEducation(updater) {
  if (typeof updater !== "function") {
    throw createEducationStorageError(
      "The education updater must be a function.",
      "The education records could not be updated.",
    );
  }

  const currentRecords = readStoredEducation();

  const nextRecords = updater([...currentRecords]);

  if (!Array.isArray(nextRecords)) {
    throw createEducationStorageError(
      "The education updater did not return an array.",
      "The education records could not be updated.",
    );
  }

  return replaceStoredEducation(nextRecords);
}

/*
 * =========================================
 * Clear Storage
 * =========================================
 */

export function clearEducationStorage() {
  const storage = getBrowserStorage();

  try {
    storage.removeItem(EDUCATION_STORAGE_KEY);
  } catch (error) {
    throw createEducationStorageError(
      "Unable to clear education storage.",
      "The saved education data could not be cleared.",
      error,
    );
  }
}

/*
 * =========================================
 * Storage Information
 * =========================================
 */

export function getEducationStorageInformation() {
  const document = readEducationStorage();

  return {
    storageKey: EDUCATION_STORAGE_KEY,

    storageVersion: document.storageVersion,

    educationModelVersion: document.educationModelVersion,

    educationCount: document.educationRecords.length,

    updatedAt: document.updatedAt,
  };
}
