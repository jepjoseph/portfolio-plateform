import {
  EXPERIENCE_MODEL_VERSION,
  normalizeExperienceCollection,
} from "../../models/experienceModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

export const EXPERIENCE_STORAGE_KEY = "portfolio-platform:experiences";

const EXPERIENCE_STORAGE_VERSION = 2;

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
 * Browser Storage
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
 * Version 1 Relationship Migration
 * =========================================
 */

function migrateVersionOneSkill(skill, index) {
  if (typeof skill === "string") {
    return {
      id: "",
      skillId: "",
      nameSnapshot: skill,
      categorySnapshot: "",
      typeSnapshot: "",
      level: "",
      usageDescription: "",
      order: index,
    };
  }

  const source = skill && typeof skill === "object" ? skill : {};

  return {
    ...source,

    skillId: source.skillId || source.profileSkillId || "",

    nameSnapshot:
      source.nameSnapshot || source.name || source.label || source.value || "",

    categorySnapshot: source.categorySnapshot || source.category || "",

    typeSnapshot: source.typeSnapshot || source.type || "",

    level: source.level || source.proficiency || "",

    usageDescription: source.usageDescription || source.description || "",

    order:
      Number.isInteger(source.order) && source.order >= 0
        ? source.order
        : index,
  };
}

function migrateVersionOneTechnology(technology, index) {
  if (typeof technology === "string") {
    return {
      id: "",
      skillId: "",
      nameSnapshot: technology,
      name: technology,
      category: "",
      proficiency: "",
      usageDescription: "",
      order: index,
    };
  }

  const source = technology && typeof technology === "object" ? technology : {};

  const nameSnapshot =
    source.nameSnapshot || source.name || source.label || source.value || "";

  return {
    ...source,

    skillId: source.skillId || source.profileSkillId || "",

    nameSnapshot,

    /*
     * Retain the compatibility field while the
     * frontend still supports version 1 records.
     */

    name: source.name || nameSnapshot,

    category: source.category || source.categorySnapshot || "",

    proficiency: source.proficiency || source.level || "",

    usageDescription: source.usageDescription || source.description || "",

    order:
      Number.isInteger(source.order) && source.order >= 0
        ? source.order
        : index,
  };
}

function migrateExperienceModelVersionOne(experience) {
  const source = experience && typeof experience === "object" ? experience : {};

  return {
    ...source,

    modelVersion: 2,

    skills: Array.isArray(source.skills)
      ? source.skills.map(migrateVersionOneSkill)
      : [],

    technologies: Array.isArray(source.technologies)
      ? source.technologies.map(migrateVersionOneTechnology)
      : [],
  };
}

/*
 * =========================================
 * Model Migration Pipeline
 * =========================================
 */

function migrateExperienceModel(experience) {
  const source = experience && typeof experience === "object" ? experience : {};

  let migratedExperience = source;

  const sourceVersion = Number(source.modelVersion) || 1;

  if (sourceVersion < 2) {
    migratedExperience = migrateExperienceModelVersionOne(migratedExperience);
  }

  return migratedExperience;
}

function migrateExperienceCollection(experiences) {
  if (!Array.isArray(experiences)) {
    return [];
  }

  return experiences.map(migrateExperienceModel);
}

/*
 * =========================================
 * Storage Document Migration
 * =========================================
 */

function migrateStorageDocument(document) {
  const source = document && typeof document === "object" ? document : {};

  const experiences = migrateExperienceCollection(source.experiences);

  return {
    storageVersion: EXPERIENCE_STORAGE_VERSION,

    experienceModelVersion: EXPERIENCE_MODEL_VERSION,

    experiences: normalizeExperienceCollection(experiences),

    updatedAt:
      typeof source.updatedAt === "string"
        ? source.updatedAt
        : new Date().toISOString(),
  };
}

/*
 * =========================================
 * Parse Storage Document
 * =========================================
 */

function parseStorageDocument(value) {
  if (!value) {
    return {
      document: createEmptyStorageDocument(),
      migrated: false,
    };
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
   * Legacy storage may contain the experience
   * collection directly as an array.
   */

  if (Array.isArray(parsedValue)) {
    return {
      document: migrateStorageDocument({
        storageVersion: 1,
        experienceModelVersion: 1,
        experiences: parsedValue,
      }),

      migrated: true,
    };
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    throw createStorageError(
      "The stored experience document has an invalid structure.",
      "The saved experience data has an invalid format.",
    );
  }

  const storageVersion = Number(parsedValue.storageVersion) || 1;

  const modelVersion = Number(parsedValue.experienceModelVersion) || 1;

  const requiresMigration =
    storageVersion < EXPERIENCE_STORAGE_VERSION ||
    modelVersion < EXPERIENCE_MODEL_VERSION ||
    parsedValue.experiences?.some(
      (experience) =>
        Number(experience?.modelVersion || 1) < EXPERIENCE_MODEL_VERSION,
    );

  if (requiresMigration) {
    return {
      document: migrateStorageDocument(parsedValue),

      migrated: true,
    };
  }

  return {
    document: {
      storageVersion: EXPERIENCE_STORAGE_VERSION,

      experienceModelVersion: EXPERIENCE_MODEL_VERSION,

      experiences: normalizeExperienceCollection(parsedValue.experiences),

      updatedAt:
        typeof parsedValue.updatedAt === "string"
          ? parsedValue.updatedAt
          : new Date().toISOString(),
    },

    migrated: false,
  };
}

/*
 * =========================================
 * Read Storage
 * =========================================
 */

export function readExperienceStorage() {
  const storage = getBrowserStorage();

  try {
    const storedValue = storage.getItem(EXPERIENCE_STORAGE_KEY);

    const { document, migrated } = parseStorageDocument(storedValue);

    /*
     * Persist the upgraded representation so the
     * migration does not run during every read.
     */

    if (migrated) {
      const migratedDocument = {
        ...document,
        updatedAt: new Date().toISOString(),
      };

      storage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(migratedDocument));

      return migratedDocument;
    }

    return document;
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
 * Write Storage
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
 * Collection Operations
 * =========================================
 */

export function readStoredExperiences() {
  return readExperienceStorage().experiences;
}

export function replaceStoredExperiences(experiences) {
  return writeExperienceStorage(experiences).experiences;
}

/*
 * =========================================
 * Clear Storage
 * =========================================
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
