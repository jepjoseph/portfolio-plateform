import {
  createEmptyProfile,
  normalizeProfile,
} from "../../models/profileModel.js";

/*
 * =========================================
 * Storage Configuration
 * =========================================
 */

export const PROFILE_STORAGE_KEY = "portfolio-platform:profile:v1";

export const PROFILE_STORAGE_VERSION = 1;

/*
 * These keys may be used by earlier versions
 * of the application.
 *
 * Remove keys from this list if they belong
 * to an unrelated feature in your project.
 */

export const LEGACY_PROFILE_STORAGE_KEYS = [
  "profile",
  "profile-data",
  "personal-information",
];

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createProfileStorageError({
  message,
  publicMessage,
  code,
  originalError = null,
}) {
  const error = new Error(message);

  error.name = "ProfileStorageError";
  error.code = code;
  error.status = 500;
  error.publicMessage = publicMessage;
  error.originalError = originalError;

  return error;
}

/*
 * =========================================
 * Browser Storage Availability
 * =========================================
 */

function getLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw createProfileStorageError({
      message: "Profile storage is unavailable outside the browser.",
      publicMessage: "Profile storage is not available in this environment.",
      code: "PROFILE_STORAGE_UNAVAILABLE",
    });
  }

  return window.localStorage;
}

/*
 * =========================================
 * Storage Error Classification
 * =========================================
 */

function isQuotaError(error) {
  return (
    error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error?.code === 22 ||
    error?.code === 1014
  );
}

function normalizeStorageError(error, operation = "access") {
  if (error?.name === "ProfileStorageError") {
    return error;
  }

  if (isQuotaError(error)) {
    return createProfileStorageError({
      message:
        "The browser does not have enough localStorage capacity to save the Profile.",
      publicMessage:
        "The Profile could not be saved because browser storage is full. Remove large local pictures or try again.",
      code: "PROFILE_STORAGE_QUOTA_EXCEEDED",
      originalError: error,
    });
  }

  return createProfileStorageError({
    message: `Unable to ${operation} the locally stored Profile: ${
      error?.message || "Unknown storage error"
    }`,

    publicMessage: "The locally stored Profile could not be accessed.",

    code: "PROFILE_STORAGE_FAILED",
    originalError: error,
  });
}

/*
 * =========================================
 * Storage Envelope
 * =========================================
 */

function createStorageEnvelope(profile) {
  return {
    storageVersion: PROFILE_STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    profile: normalizeProfile(profile),
  };
}

function isStorageEnvelope(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.profile &&
    typeof value.profile === "object" &&
    !Array.isArray(value.profile),
  );
}

/*
 * =========================================
 * Parse Stored Value
 * =========================================
 */

function parseStoredProfile(rawValue) {
  const parsedValue = JSON.parse(rawValue);

  /*
   * Current format:
   *
   * {
   *   storageVersion,
   *   savedAt,
   *   profile
   * }
   */

  if (isStorageEnvelope(parsedValue)) {
    return {
      profile: normalizeProfile(parsedValue.profile),

      storageVersion: Number(parsedValue.storageVersion) || 0,

      savedAt:
        typeof parsedValue.savedAt === "string" ? parsedValue.savedAt : "",

      wasLegacyFormat: false,
    };
  }

  /*
   * Legacy format:
   *
   * {
   *   firstName,
   *   lastName,
   *   professionalTitles,
   *   emails,
   *   ...
   * }
   */

  if (
    parsedValue &&
    typeof parsedValue === "object" &&
    !Array.isArray(parsedValue)
  ) {
    return {
      profile: normalizeProfile(parsedValue),
      storageVersion: 0,
      savedAt: "",
      wasLegacyFormat: true,
    };
  }

  throw createProfileStorageError({
    message: "The stored Profile does not contain a valid object.",
    publicMessage: "The locally stored Profile has an invalid format.",
    code: "INVALID_PROFILE_STORAGE_FORMAT",
  });
}

/*
 * =========================================
 * Corrupted Storage Backup
 * =========================================
 */

function preserveCorruptedValue(storage, storageKey, rawValue) {
  if (!rawValue) {
    return "";
  }

  const corruptedKey = `${storageKey}:corrupted:${Date.now()}`;

  try {
    storage.setItem(corruptedKey, rawValue);

    return corruptedKey;
  } catch (error) {
    /*
     * Storage may already be full. Failure to
     * preserve corrupted data must not prevent
     * the application from recovering.
     */

    console.error("Unable to preserve corrupted Profile storage:", error);

    return "";
  }
}

/*
 * =========================================
 * Find Legacy Profile
 * =========================================
 */

function findLegacyStoredProfile(storage) {
  for (const legacyKey of LEGACY_PROFILE_STORAGE_KEYS) {
    const rawValue = storage.getItem(legacyKey);

    if (!rawValue) {
      continue;
    }

    try {
      const parsedResult = parseStoredProfile(rawValue);

      return {
        ...parsedResult,
        legacyKey,
      };
    } catch (error) {
      console.error(
        `Unable to read legacy Profile storage "${legacyKey}":`,
        error,
      );
    }
  }

  return null;
}

/*
 * =========================================
 * Save Profile
 * =========================================
 */

export function replaceStoredProfile(profileValue) {
  try {
    const storage = getLocalStorage();

    const normalizedProfile = normalizeProfile(profileValue);

    const envelope = createStorageEnvelope(normalizedProfile);

    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(envelope));

    return normalizedProfile;
  } catch (error) {
    throw normalizeStorageError(error, "save");
  }
}

/*
 * =========================================
 * Read Profile
 * =========================================
 *
 * fallbackProfile lets the future context pass
 * your existing in-memory INITIAL_PROFILE during
 * the first migration.
 */

export function readStoredProfile({
  fallbackProfile = null,
  migrateLegacy = true,
} = {}) {
  let storage;

  try {
    storage = getLocalStorage();
  } catch (error) {
    throw normalizeStorageError(error, "read");
  }

  const rawValue = storage.getItem(PROFILE_STORAGE_KEY);

  /*
   * Current storage exists.
   */

  if (rawValue) {
    try {
      const result = parseStoredProfile(rawValue);

      /*
       * Rewrite raw legacy objects or older
       * envelopes into the current format.
       */

      if (
        migrateLegacy &&
        (result.wasLegacyFormat ||
          result.storageVersion !== PROFILE_STORAGE_VERSION)
      ) {
        replaceStoredProfile(result.profile);
      }

      return result.profile;
    } catch (error) {
      const corruptedBackupKey = preserveCorruptedValue(
        storage,
        PROFILE_STORAGE_KEY,
        rawValue,
      );

      try {
        storage.removeItem(PROFILE_STORAGE_KEY);
      } catch (removeError) {
        console.error(
          "Unable to remove corrupted Profile storage:",
          removeError,
        );
      }

      console.error("The stored Profile was corrupted.", {
        error,
        corruptedBackupKey,
      });
    }
  }

  /*
   * Search earlier storage keys.
   */

  if (migrateLegacy) {
    const legacyResult = findLegacyStoredProfile(storage);

    if (legacyResult) {
      const migratedProfile = replaceStoredProfile(legacyResult.profile);

      /*
       * Remove only the successfully migrated
       * legacy value.
       */

      try {
        storage.removeItem(legacyResult.legacyKey);
      } catch (error) {
        console.error(
          "Unable to remove migrated legacy Profile storage:",
          error,
        );
      }

      return migratedProfile;
    }
  }

  /*
   * First application load:
   * normalize and persist the supplied fallback.
   */

  if (fallbackProfile && typeof fallbackProfile === "object") {
    return replaceStoredProfile(fallbackProfile);
  }

  const emptyProfile = createEmptyProfile();

  return replaceStoredProfile(emptyProfile);
}

/*
 * =========================================
 * Storage Metadata
 * =========================================
 */

export function readStoredProfileMetadata() {
  try {
    const storage = getLocalStorage();

    const rawValue = storage.getItem(PROFILE_STORAGE_KEY);

    if (!rawValue) {
      return {
        exists: false,
        storageVersion: null,
        savedAt: "",
      };
    }

    const parsedValue = JSON.parse(rawValue);

    if (!isStorageEnvelope(parsedValue)) {
      return {
        exists: true,
        storageVersion: 0,
        savedAt: "",
      };
    }

    return {
      exists: true,

      storageVersion: Number(parsedValue.storageVersion) || 0,

      savedAt:
        typeof parsedValue.savedAt === "string" ? parsedValue.savedAt : "",
    };
  } catch (error) {
    throw normalizeStorageError(error, "read Profile storage metadata from");
  }
}

/*
 * =========================================
 * Storage Presence
 * =========================================
 */

export function hasStoredProfile() {
  try {
    const storage = getLocalStorage();

    return Boolean(storage.getItem(PROFILE_STORAGE_KEY));
  } catch {
    return false;
  }
}

/*
 * =========================================
 * Remove Profile
 * =========================================
 */

export function removeStoredProfile() {
  try {
    const storage = getLocalStorage();

    const existed = Boolean(storage.getItem(PROFILE_STORAGE_KEY));

    storage.removeItem(PROFILE_STORAGE_KEY);

    return {
      removed: existed,
      storageKey: PROFILE_STORAGE_KEY,
    };
  } catch (error) {
    throw normalizeStorageError(error, "remove");
  }
}

/*
 * =========================================
 * Explicit Migration
 * =========================================
 */

export function migrateStoredProfile(fallbackProfile = null) {
  return readStoredProfile({
    fallbackProfile,
    migrateLegacy: true,
  });
}

/*
 * =========================================
 * Reset Profile
 * =========================================
 */

export function resetStoredProfile(fallbackProfile = null) {
  const nextProfile =
    fallbackProfile && typeof fallbackProfile === "object"
      ? normalizeProfile(fallbackProfile)
      : createEmptyProfile();

  return replaceStoredProfile(nextProfile);
}
