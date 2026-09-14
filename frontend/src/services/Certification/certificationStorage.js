import {
  CERTIFICATION_MODEL_VERSION,
  normalizeCertificationCollection,
} from "../../models/certificationModel.js";

export const CERTIFICATION_STORAGE_KEY = "portfolio-platform:certifications";

const CERTIFICATION_STORAGE_VERSION = 1;

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createCertificationStorageError(message, publicMessage, cause = null) {
  const error = new Error(message);

  error.name = "CertificationStorageError";
  error.code = "CERTIFICATION_STORAGE_ERROR";
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
  if (typeof window === "undefined" || !window.localStorage) {
    throw createCertificationStorageError(
      "Certification storage is unavailable.",
      "Certification storage is not supported in this environment.",
    );
  }

  return window.localStorage;
}

/*
 * =========================================
 * Empty Storage Document
 * =========================================
 */

function createEmptyCertificationStorageDocument() {
  return {
    storageVersion: CERTIFICATION_STORAGE_VERSION,

    certificationModelVersion: CERTIFICATION_MODEL_VERSION,

    certificationRecords: [],

    updatedAt: new Date().toISOString(),
  };
}

/*
 * =========================================
 * Parse Storage Document
 * =========================================
 */

function parseCertificationStorageDocument(value) {
  if (!value) {
    return createEmptyCertificationStorageDocument();
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(value);
  } catch (cause) {
    throw createCertificationStorageError(
      "Unable to parse stored certification data.",
      "The saved Certification Library could not be read.",
      cause,
    );
  }

  /*
   * Support the original format where the stored
   * value was only an array of certifications.
   */

  if (Array.isArray(parsedValue)) {
    return {
      ...createEmptyCertificationStorageDocument(),

      certificationRecords: normalizeCertificationCollection(parsedValue),
    };
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    throw createCertificationStorageError(
      "Stored certification data has an invalid structure.",
      "The saved Certification Library has an invalid format.",
    );
  }

  return {
    storageVersion:
      Number(parsedValue.storageVersion) || CERTIFICATION_STORAGE_VERSION,

    certificationModelVersion:
      Number(parsedValue.certificationModelVersion) ||
      CERTIFICATION_MODEL_VERSION,

    certificationRecords: normalizeCertificationCollection(
      parsedValue.certificationRecords ||
        parsedValue.certifications ||
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

export function readCertificationStorage() {
  const storage = getBrowserStorage();

  try {
    return parseCertificationStorageDocument(
      storage.getItem(CERTIFICATION_STORAGE_KEY),
    );
  } catch (error) {
    if (error?.name === "CertificationStorageError") {
      throw error;
    }

    throw createCertificationStorageError(
      "Unable to read Certification Library storage.",
      "Your saved certification records could not be loaded.",
      error,
    );
  }
}

/*
 * =========================================
 * Write Storage
 * =========================================
 */

export function writeCertificationStorage(certificationRecords) {
  const storage = getBrowserStorage();

  const document = {
    storageVersion: CERTIFICATION_STORAGE_VERSION,

    certificationModelVersion: CERTIFICATION_MODEL_VERSION,

    /*
     * normalizeCertificationCollection removes
     * transient File, Blob, and object-URL values
     * because they are not part of the model.
     *
     * Only document metadata and IndexedDB storage
     * keys are written to localStorage.
     */

    certificationRecords:
      normalizeCertificationCollection(certificationRecords),

    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(CERTIFICATION_STORAGE_KEY, JSON.stringify(document));

    return document;
  } catch (error) {
    throw createCertificationStorageError(
      "Unable to write Certification Library storage.",
      "Your certification records could not be saved.",
      error,
    );
  }
}

/*
 * =========================================
 * Read Collection
 * =========================================
 */

export function readStoredCertifications() {
  return readCertificationStorage().certificationRecords;
}

/*
 * =========================================
 * Replace Collection
 * =========================================
 */

export function replaceStoredCertifications(certificationRecords) {
  return writeCertificationStorage(certificationRecords).certificationRecords;
}

/*
 * =========================================
 * Update Collection
 * =========================================
 */

export function updateStoredCertifications(updater) {
  if (typeof updater !== "function") {
    throw createCertificationStorageError(
      "The certification updater must be a function.",
      "The Certification Library could not be updated.",
    );
  }

  const currentRecords = [...readStoredCertifications()];

  const nextRecords = updater(currentRecords);

  if (!Array.isArray(nextRecords)) {
    throw createCertificationStorageError(
      "The certification updater did not return an array.",
      "The Certification Library could not be updated.",
    );
  }

  return replaceStoredCertifications(nextRecords);
}

/*
 * =========================================
 * Clear Storage
 * =========================================
 */

export function clearCertificationStorage() {
  try {
    getBrowserStorage().removeItem(CERTIFICATION_STORAGE_KEY);
  } catch (error) {
    throw createCertificationStorageError(
      "Unable to clear Certification Library storage.",
      "The saved Certification Library could not be cleared.",
      error,
    );
  }
}

/*
 * =========================================
 * Storage Information
 * =========================================
 */

export function getCertificationStorageInformation() {
  const document = readCertificationStorage();

  return {
    storageKey: CERTIFICATION_STORAGE_KEY,

    storageVersion: document.storageVersion,

    certificationModelVersion: document.certificationModelVersion,

    certificationCount: document.certificationRecords.length,

    updatedAt: document.updatedAt,
  };
}
