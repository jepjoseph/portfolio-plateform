import {
  PROJECT_MODEL_VERSION,
  normalizeProjectCollection,
} from "../../models/projectModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

export const PROJECT_STORAGE_KEY =
  "portfolio-platform:projects";

export const PROJECT_STORAGE_RECOVERY_KEY =
  "portfolio-platform:projects:recovery";

export const PROJECT_STORAGE_VERSION = 2;

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createProjectStorageError(
  code,
  message,
  publicMessage,
  cause = null,
) {
  const error = new Error(message);

  error.name = "ProjectStorageError";
  error.code = code;
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
    throw createProjectStorageError(
      "PROJECT_STORAGE_ENVIRONMENT_UNAVAILABLE",
      "Window is unavailable.",
      "Project storage is not supported in this environment.",
    );
  }

  try {
    if (!window.localStorage) {
      throw new Error("localStorage is unavailable.");
    }

    return window.localStorage;
  } catch (cause) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_ACCESS_DENIED",
      "Browser localStorage could not be accessed.",
      "Project storage is unavailable. Check your browser privacy and storage settings.",
      cause,
    );
  }
}

/*
 * =========================================
 * Empty Storage Document
 * =========================================
 */

function createEmptyProjectStorageDocument() {
  return {
    storageVersion: PROJECT_STORAGE_VERSION,

    projectModelVersion: PROJECT_MODEL_VERSION,

    projectRecords: [],

    updatedAt: new Date().toISOString(),
  };
}

/*
 * =========================================
 * Recovery Copy
 * =========================================
 *
 * If stored JSON is corrupted, retain its raw
 * value under a recovery key before reporting
 * the error. This avoids silently discarding
 * potentially recoverable Project metadata.
 */

function preserveRecoveryCopy(
  storage,
  rawValue,
  reason,
) {
  if (!rawValue) {
    return;
  }

  try {
    storage.setItem(
      PROJECT_STORAGE_RECOVERY_KEY,
      JSON.stringify({
        originalStorageKey: PROJECT_STORAGE_KEY,
        reason,
        recoveredAt: new Date().toISOString(),
        rawValue,
      }),
    );
  } catch {
    /*
     * Recovery storage is best effort. Do not
     * replace the original error if the browser
     * cannot save the recovery copy.
     */
  }
}

/*
 * =========================================
 * Record Collection Resolution
 * =========================================
 */

function getStoredRecordCollection(document) {
  if (Array.isArray(document.projectRecords)) {
    return document.projectRecords;
  }

  if (Array.isArray(document.projects)) {
    return document.projects;
  }

  if (Array.isArray(document.records)) {
    return document.records;
  }

  /*
   * A completely absent collection represents
   * an empty library. A present collection with
   * the wrong type represents corruption.
   */

  const hasCollectionProperty =
    Object.prototype.hasOwnProperty.call(
      document,
      "projectRecords",
    ) ||
    Object.prototype.hasOwnProperty.call(
      document,
      "projects",
    ) ||
    Object.prototype.hasOwnProperty.call(
      document,
      "records",
    );

  if (!hasCollectionProperty) {
    return [];
  }

  throw createProjectStorageError(
    "PROJECT_STORAGE_RECORDS_INVALID",
    "The stored Project collection is not an array.",
    "The saved Project Library contains an invalid record collection.",
  );
}

/*
 * =========================================
 * Storage Migration
 * =========================================
 */

function migrateProjectStorageDocument(
  storedDocument,
) {
  /*
   * Original storage sometimes contained only
   * the Project array.
   */

  if (Array.isArray(storedDocument)) {
    return {
      document: {
        ...createEmptyProjectStorageDocument(),

        projectRecords:
          normalizeProjectCollection(
            storedDocument,
          ),
      },

      wasMigrated: true,
    };
  }

  if (
    !storedDocument ||
    typeof storedDocument !== "object"
  ) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_DOCUMENT_INVALID",
      "Stored Project data has an invalid structure.",
      "The saved Project Library has an invalid format.",
    );
  }

  const storedVersion =
    Number(storedDocument.storageVersion) || 1;

  if (storedVersion > PROJECT_STORAGE_VERSION) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_VERSION_UNSUPPORTED",
      `Stored Project version ${storedVersion} is newer than supported version ${PROJECT_STORAGE_VERSION}.`,
      "This Project Library was created by a newer version of the application and cannot be opened safely.",
    );
  }

  const storedRecords =
    getStoredRecordCollection(storedDocument);

  /*
   * normalizeProjectCollection performs the
   * model migration. It upgrades version-1
   * Projects to the current model structure.
   */

  const normalizedRecords =
    normalizeProjectCollection(storedRecords);

  const wasMigrated =
    storedVersion !== PROJECT_STORAGE_VERSION ||
    Number(storedDocument.projectModelVersion) !==
      PROJECT_MODEL_VERSION ||
    !Array.isArray(storedDocument.projectRecords);

  return {
    document: {
      storageVersion: PROJECT_STORAGE_VERSION,

      projectModelVersion: PROJECT_MODEL_VERSION,

      projectRecords: normalizedRecords,

      updatedAt:
        typeof storedDocument.updatedAt ===
        "string"
          ? storedDocument.updatedAt
          : new Date().toISOString(),
    },

    wasMigrated,
  };
}

/*
 * =========================================
 * Parse Storage Document
 * =========================================
 */

function parseProjectStorageDocument(rawValue) {
  if (!rawValue) {
    return {
      document:
        createEmptyProjectStorageDocument(),

      wasMigrated: false,
    };
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch (cause) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_JSON_INVALID",
      "Unable to parse stored Project data.",
      "The saved Project Library could not be read because its data is damaged.",
      cause,
    );
  }

  return migrateProjectStorageDocument(
    parsedValue,
  );
}

/*
 * =========================================
 * Internal Document Write
 * =========================================
 */

function writeStorageDocument(
  storage,
  document,
) {
  let serializedDocument;

  try {
    serializedDocument = JSON.stringify(document);
  } catch (cause) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_SERIALIZATION_FAILED",
      "Project storage could not be serialized.",
      "Your Project records could not be prepared for storage.",
      cause,
    );
  }

  try {
    storage.setItem(
      PROJECT_STORAGE_KEY,
      serializedDocument,
    );
  } catch (cause) {
    const isQuotaError =
      cause?.name === "QuotaExceededError" ||
      cause?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      cause?.code === 22 ||
      cause?.code === 1014;

    throw createProjectStorageError(
      isQuotaError
        ? "PROJECT_STORAGE_QUOTA_EXCEEDED"
        : "PROJECT_STORAGE_WRITE_FAILED",

      isQuotaError
        ? "Project localStorage quota was exceeded."
        : "Unable to write Project Library storage.",

      isQuotaError
        ? "The browser does not have enough storage space for the Project Library metadata."
        : "Your Project records could not be saved.",

      cause,
    );
  }

  return document;
}

/*
 * =========================================
 * Read Project Storage
 * =========================================
 */

export function readProjectStorage({
  persistMigration = true,
} = {}) {
  const storage = getBrowserStorage();

  let rawValue;

  try {
    rawValue = storage.getItem(
      PROJECT_STORAGE_KEY,
    );
  } catch (cause) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_READ_FAILED",
      "Unable to read Project Library storage.",
      "Your saved Project records could not be loaded.",
      cause,
    );
  }

  try {
    const {
      document,
      wasMigrated,
    } = parseProjectStorageDocument(rawValue);

    /*
     * Persist successful migrations so every
     * future read uses the current schema.
     */

    if (
      rawValue &&
      wasMigrated &&
      persistMigration
    ) {
      return writeStorageDocument(
        storage,
        {
          ...document,
          updatedAt: new Date().toISOString(),
        },
      );
    }

    return document;
  } catch (error) {
    preserveRecoveryCopy(
      storage,
      rawValue,
      error?.code || "PROJECT_STORAGE_READ_FAILED",
    );

    if (error?.name === "ProjectStorageError") {
      throw error;
    }

    throw createProjectStorageError(
      "PROJECT_STORAGE_READ_FAILED",
      "Unable to read Project Library storage.",
      "Your saved Project records could not be loaded.",
      error,
    );
  }
}

/*
 * =========================================
 * Write Project Storage
 * =========================================
 */

export function writeProjectStorage(
  projectRecords,
) {
  if (!Array.isArray(projectRecords)) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_WRITE_INPUT_INVALID",
      "Project records must be supplied as an array.",
      "The Project Library could not be saved because the record collection is invalid.",
    );
  }

  const storage = getBrowserStorage();

  const document = {
    storageVersion: PROJECT_STORAGE_VERSION,

    projectModelVersion: PROJECT_MODEL_VERSION,

    projectRecords:
      normalizeProjectCollection(
        projectRecords,
      ),

    updatedAt: new Date().toISOString(),
  };

  return writeStorageDocument(
    storage,
    document,
  );
}

/*
 * =========================================
 * Read Stored Projects
 * =========================================
 */

export function readStoredProjects() {
  return readProjectStorage().projectRecords;
}

/*
 * =========================================
 * Replace Stored Projects
 * =========================================
 */

export function replaceStoredProjects(
  projectRecords,
) {
  return writeProjectStorage(
    projectRecords,
  ).projectRecords;
}

/*
 * =========================================
 * Update Stored Projects
 * =========================================
 */

export function updateStoredProjects(updater) {
  if (typeof updater !== "function") {
    throw createProjectStorageError(
      "PROJECT_STORAGE_UPDATER_INVALID",
      "The Project updater must be a function.",
      "The Project Library could not be updated.",
    );
  }

  const currentRecords = readStoredProjects();

  /*
   * Supply a new array so the updater cannot
   * mutate the collection currently returned
   * by the storage reader.
   */

  const nextRecords = updater([
    ...currentRecords,
  ]);

  if (!Array.isArray(nextRecords)) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_UPDATE_RESULT_INVALID",
      "The Project updater did not return an array.",
      "The Project Library could not be updated.",
    );
  }

  return replaceStoredProjects(nextRecords);
}

/*
 * =========================================
 * Recovery Information
 * =========================================
 */

export function readProjectStorageRecovery() {
  const storage = getBrowserStorage();

  let rawRecoveryValue;

  try {
    rawRecoveryValue = storage.getItem(
      PROJECT_STORAGE_RECOVERY_KEY,
    );
  } catch {
    return null;
  }

  if (!rawRecoveryValue) {
    return null;
  }

  try {
    return JSON.parse(rawRecoveryValue);
  } catch {
    return {
      reason:
        "PROJECT_STORAGE_RECOVERY_JSON_INVALID",

      rawValue: rawRecoveryValue,
    };
  }
}

/*
 * =========================================
 * Clear Recovery Information
 * =========================================
 */

export function clearProjectStorageRecovery() {
  const storage = getBrowserStorage();

  try {
    storage.removeItem(
      PROJECT_STORAGE_RECOVERY_KEY,
    );
  } catch (cause) {
    throw createProjectStorageError(
      "PROJECT_STORAGE_RECOVERY_CLEAR_FAILED",
      "Unable to clear Project recovery information.",
      "The Project recovery information could not be removed.",
      cause,
    );
  }
}