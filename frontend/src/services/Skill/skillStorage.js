import {
  normalizeSkillCollection,
  SKILL_MODEL_VERSION,
} from "../../models/skillModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

export const SKILL_STORAGE_KEY = "portfolio-platform:skills";

const SKILL_STORAGE_VERSION = 1;

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createSkillStorageError(message, publicMessage, cause) {
  const error = new Error(message);

  error.name = "SkillStorageError";
  error.code = "SKILL_STORAGE_ERROR";
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
    throw createSkillStorageError(
      "Skill storage is unavailable outside the browser.",
      "Skill storage is currently unavailable.",
    );
  }

  if (!window.localStorage) {
    throw createSkillStorageError(
      "The browser does not provide local storage.",
      "Your browser does not support local skill storage.",
    );
  }

  return window.localStorage;
}

/*
 * =========================================
 * Empty Storage Document
 * =========================================
 */

function createEmptySkillStorageDocument() {
  return {
    storageVersion: SKILL_STORAGE_VERSION,
    skillModelVersion: SKILL_MODEL_VERSION,
    skills: [],
    updatedAt: new Date().toISOString(),
  };
}

/*
 * =========================================
 * Parse Storage Document
 * =========================================
 */

function parseSkillStorageDocument(value) {
  if (!value) {
    return createEmptySkillStorageDocument();
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(value);
  } catch (cause) {
    throw createSkillStorageError(
      "Unable to parse stored skill data.",
      "The saved Skill Library could not be read.",
      cause,
    );
  }

  /*
   * Support an older storage format where the
   * collection was saved directly as an array.
   */

  if (Array.isArray(parsedValue)) {
    return {
      ...createEmptySkillStorageDocument(),

      skills: normalizeSkillCollection(parsedValue),
    };
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    throw createSkillStorageError(
      "The stored Skill Library has an invalid structure.",
      "The saved Skill Library has an invalid format.",
    );
  }

  return {
    storageVersion: Number(parsedValue.storageVersion) || SKILL_STORAGE_VERSION,

    skillModelVersion:
      Number(parsedValue.skillModelVersion) || SKILL_MODEL_VERSION,

    skills: normalizeSkillCollection(parsedValue.skills),

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

export function readSkillStorage() {
  const storage = getBrowserStorage();

  try {
    const storedValue = storage.getItem(SKILL_STORAGE_KEY);

    return parseSkillStorageDocument(storedValue);
  } catch (error) {
    if (error?.name === "SkillStorageError") {
      throw error;
    }

    throw createSkillStorageError(
      "Unable to read the Skill Library.",
      "Your saved skills could not be loaded.",
      error,
    );
  }
}

/*
 * =========================================
 * Write Storage Document
 * =========================================
 */

export function writeSkillStorage(skills) {
  const storage = getBrowserStorage();

  const storageDocument = {
    storageVersion: SKILL_STORAGE_VERSION,
    skillModelVersion: SKILL_MODEL_VERSION,

    skills: normalizeSkillCollection(skills),

    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(SKILL_STORAGE_KEY, JSON.stringify(storageDocument));

    return storageDocument;
  } catch (error) {
    throw createSkillStorageError(
      "Unable to write the Skill Library.",
      "Your skills could not be saved in this browser.",
      error,
    );
  }
}

/*
 * =========================================
 * Read Skills
 * =========================================
 */

export function readStoredSkills() {
  return readSkillStorage().skills;
}

/*
 * =========================================
 * Replace Skills
 * =========================================
 */

export function replaceStoredSkills(skills) {
  return writeSkillStorage(skills).skills;
}

/*
 * =========================================
 * Update Skills Transaction
 * =========================================
 *
 * This reads the current collection, applies an
 * updater, and saves the returned collection.
 */

export function updateStoredSkills(updater) {
  if (typeof updater !== "function") {
    throw createSkillStorageError(
      "The Skill Library updater must be a function.",
      "The Skill Library could not be updated.",
    );
  }

  const currentSkills = readStoredSkills();

  const nextSkills = updater([...currentSkills]);

  if (!Array.isArray(nextSkills)) {
    throw createSkillStorageError(
      "The Skill Library updater did not return an array.",
      "The Skill Library could not be updated.",
    );
  }

  return replaceStoredSkills(nextSkills);
}

/*
 * =========================================
 * Clear Skill Storage
 * =========================================
 *
 * This removes the entire local Skill Library.
 * Normal delete operations should remove only one
 * skill through skillService.js.
 */

export function clearSkillStorage() {
  const storage = getBrowserStorage();

  try {
    storage.removeItem(SKILL_STORAGE_KEY);
  } catch (error) {
    throw createSkillStorageError(
      "Unable to clear the Skill Library.",
      "The saved Skill Library could not be cleared.",
      error,
    );
  }
}

/*
 * =========================================
 * Storage Information
 * =========================================
 */

export function getSkillStorageInformation() {
  const document = readSkillStorage();

  return {
    storageKey: SKILL_STORAGE_KEY,
    storageVersion: document.storageVersion,

    skillModelVersion: document.skillModelVersion,

    skillCount: document.skills.length,

    updatedAt: document.updatedAt,
  };
}
