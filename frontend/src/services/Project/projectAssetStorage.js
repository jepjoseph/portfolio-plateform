import {
  isProjectDocumentWithinSizeLimit,
  isProjectMediaWithinSizeLimit,
  isSupportedProjectDocument,
  isSupportedProjectMedia,
} from "../../config/projectConfig.js";

import { createProjectId } from "../../models/projectModel.js";

/*
 * =========================================
 * IndexedDB Configuration
 * =========================================
 */

export const PROJECT_ASSET_DATABASE_NAME = "portfolio-platform:project-assets";

export const PROJECT_ASSET_DATABASE_VERSION = 1;

export const PROJECT_ASSET_STORE_NAME = "assets";

export const PROJECT_ID_INDEX_NAME = "projectId";

export const ASSET_KIND_INDEX_NAME = "kind";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createProjectAssetStorageError({
  code = "PROJECT_ASSET_STORAGE_ERROR",
  message,
  publicMessage,
  cause = null,
  details = {},
}) {
  const error = new Error(message);

  error.name = "ProjectAssetStorageError";
  error.code = code;
  error.publicMessage = publicMessage;

  Object.assign(error, details);

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/*
 * =========================================
 * Quota Error Detection
 * =========================================
 */

function isStorageQuotaError(error) {
  return (
    error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error?.code === 22 ||
    error?.code === 1014
  );
}

/*
 * =========================================
 * IndexedDB Availability
 * =========================================
 */

function getIndexedDb() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_STORAGE_UNAVAILABLE",

      message: "IndexedDB is unavailable.",

      publicMessage:
        "Project media and document storage is not supported in this browser.",
    });
  }

  return window.indexedDB;
}

/*
 * =========================================
 * Promise Helpers
 * =========================================
 */

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(
        transaction.error ||
          new Error("The IndexedDB transaction was aborted."),
      );
    };
  });
}

/*
 * =========================================
 * Open Database
 * =========================================
 */

function openProjectAssetDatabase() {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(
      PROJECT_ASSET_DATABASE_NAME,
      PROJECT_ASSET_DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      let store;

      if (!database.objectStoreNames.contains(PROJECT_ASSET_STORE_NAME)) {
        store = database.createObjectStore(PROJECT_ASSET_STORE_NAME, {
          keyPath: "storageKey",
        });
      } else {
        store = request.transaction.objectStore(PROJECT_ASSET_STORE_NAME);
      }

      if (!store.indexNames.contains(PROJECT_ID_INDEX_NAME)) {
        store.createIndex(PROJECT_ID_INDEX_NAME, "projectId", {
          unique: false,
        });
      }

      if (!store.indexNames.contains(ASSET_KIND_INDEX_NAME)) {
        store.createIndex(ASSET_KIND_INDEX_NAME, "kind", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => {
      const database = request.result;

      /*
       * A tab holding an old database connection
       * must close it when another tab upgrades
       * the database.
       */

      database.onversionchange = () => {
        database.close();
      };

      resolve(database);
    };

    request.onerror = () => {
      reject(
        createProjectAssetStorageError({
          code: "PROJECT_ASSET_DATABASE_OPEN_FAILED",

          message: "Unable to open Project asset storage.",

          publicMessage: "Project file storage could not be opened.",

          cause: request.error,
        }),
      );
    };

    request.onblocked = () => {
      reject(
        createProjectAssetStorageError({
          code: "PROJECT_ASSET_DATABASE_BLOCKED",

          message: "The Project asset database operation was blocked.",

          publicMessage: "Close other tabs using this portfolio and try again.",
        }),
      );
    };
  });
}

/*
 * =========================================
 * Asset Kind
 * =========================================
 */

function normalizeAssetKind(kind) {
  return kind === "document" ? "document" : "media";
}

/*
 * =========================================
 * File Validation
 * =========================================
 */

function validateProjectAssetFile(file, kind) {
  if (!file || typeof file !== "object" || typeof file.slice !== "function") {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_FILE_REQUIRED",

      message: "A valid File or Blob-like object is required.",

      publicMessage: "Select a valid Project file before uploading.",
    });
  }

  const isSupported =
    kind === "media"
      ? isSupportedProjectMedia(file)
      : isSupportedProjectDocument(file);

  if (!isSupported) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_FILE_TYPE_UNSUPPORTED",

      message: "The selected Project asset type is unsupported.",

      publicMessage:
        kind === "media"
          ? "Upload a supported JPG, PNG, WebP, GIF, MP4, or WebM file."
          : "Upload a supported Project document type.",
    });
  }

  const isWithinSizeLimit =
    kind === "media"
      ? isProjectMediaWithinSizeLimit(file)
      : isProjectDocumentWithinSizeLimit(file);

  if (!isWithinSizeLimit) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_FILE_SIZE_INVALID",

      message: "The selected Project asset exceeds its size limit or is empty.",

      publicMessage:
        kind === "media"
          ? "The selected image or video is empty or exceeds the permitted size."
          : "The selected document is empty or exceeds the permitted size.",
    });
  }
}

/*
 * =========================================
 * Public Asset Metadata
 * =========================================
 */

function createAssetMetadata(record) {
  if (!record) {
    return null;
  }

  return {
    storageKey: record.storageKey,

    projectId: record.projectId,

    assetId: record.assetId,

    kind: record.kind,

    fileName: record.fileName,

    mimeType: record.mimeType,

    fileSize: record.fileSize,

    createdAt: record.createdAt,

    updatedAt: record.updatedAt,
  };
}

/*
 * =========================================
 * Write Asset
 * =========================================
 */

export async function writeProjectAsset({
  file,
  projectId,
  assetId = "",
  storageKey = "",
  kind = "media",
} = {}) {
  const normalizedKind = normalizeAssetKind(kind);

  const normalizedProjectId = getText(projectId);

  if (!normalizedProjectId) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_PROJECT_ID_REQUIRED",

      message: "A Project identifier is required before storing an asset.",

      publicMessage:
        "The Project file cannot be saved because the Project could not be identified.",
    });
  }

  validateProjectAssetFile(file, normalizedKind);

  const resolvedAssetId = getText(assetId) || createProjectId("project-asset");

  const resolvedStorageKey =
    getText(storageKey) ||
    `project:${normalizedProjectId}:${normalizedKind}:${resolvedAssetId}`;

  const database = await openProjectAssetDatabase();

  const timestamp = new Date().toISOString();

  try {
    const transaction = database.transaction(
      PROJECT_ASSET_STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(PROJECT_ASSET_STORE_NAME);

    /*
     * The read and write are handled within the
     * same request callback so the transaction
     * cannot become inactive between operations.
     */

    const existingRequest = store.get(resolvedStorageKey);

    const preparedRecordPromise = new Promise((resolve, reject) => {
      existingRequest.onerror = () => {
        reject(existingRequest.error);
      };

      existingRequest.onsuccess = () => {
        const existingRecord = existingRequest.result;

        /*
         * Never allow a storage key belonging
         * to another Project to be overwritten.
         */

        if (
          existingRecord &&
          existingRecord.projectId !== normalizedProjectId
        ) {
          transaction.abort();

          reject(
            createProjectAssetStorageError({
              code: "PROJECT_ASSET_STORAGE_KEY_CONFLICT",

              message:
                "The requested asset storage key belongs to another Project.",

              publicMessage:
                "The Project file could not be saved because its storage identifier conflicts with another file.",
            }),
          );

          return;
        }

        const blob = file.slice(
          0,
          file.size,
          file.type || "application/octet-stream",
        );

        const record = {
          storageKey: resolvedStorageKey,

          projectId: normalizedProjectId,

          assetId: resolvedAssetId,

          kind: normalizedKind,

          fileName: getText(file.name),

          mimeType: getText(file.type) || "application/octet-stream",

          fileSize: Number(file.size) || 0,

          blob,

          createdAt: existingRecord?.createdAt || timestamp,

          updatedAt: timestamp,
        };

        const putRequest = store.put(record);

        putRequest.onerror = () => {
          reject(putRequest.error);
        };

        putRequest.onsuccess = () => {
          resolve(record);
        };
      };
    });

    const [record] = await Promise.all([
      preparedRecordPromise,
      transactionToPromise(transaction),
    ]);

    return createAssetMetadata(record);
  } catch (error) {
    if (error?.name === "ProjectAssetStorageError") {
      throw error;
    }

    const quotaExceeded = isStorageQuotaError(error);

    throw createProjectAssetStorageError({
      code: quotaExceeded
        ? "PROJECT_ASSET_QUOTA_EXCEEDED"
        : "PROJECT_ASSET_WRITE_FAILED",

      message: quotaExceeded
        ? "IndexedDB storage quota was exceeded."
        : "Unable to save a Project asset.",

      publicMessage: quotaExceeded
        ? "The browser does not have enough storage space for this Project file. Remove unused files or choose a smaller file."
        : "The selected Project file could not be saved.",

      cause: error,
    });
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Read Asset
 * =========================================
 */

export async function readProjectAsset(storageKey) {
  const normalizedStorageKey = getText(storageKey);

  if (!normalizedStorageKey) {
    return null;
  }

  const database = await openProjectAssetDatabase();

  try {
    const transaction = database.transaction(
      PROJECT_ASSET_STORE_NAME,
      "readonly",
    );

    const store = transaction.objectStore(PROJECT_ASSET_STORE_NAME);

    const record = await requestToPromise(store.get(normalizedStorageKey));

    await transactionToPromise(transaction);

    return record || null;
  } catch (error) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_READ_FAILED",

      message: "Unable to read a Project asset.",

      publicMessage: "The Project file could not be loaded.",

      cause: error,
    });
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Asset Existence
 * =========================================
 */

export async function hasProjectAsset(storageKey) {
  const record = await readProjectAsset(storageKey);

  return Boolean(record?.blob);
}

/*
 * =========================================
 * Create Object URL
 * =========================================
 */

export async function createProjectAssetUrl(storageKey) {
  const normalizedStorageKey = getText(storageKey);

  if (!normalizedStorageKey) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_STORAGE_KEY_REQUIRED",

      message: "An asset storage key is required.",

      publicMessage: "The Project file could not be identified.",
    });
  }

  const record = await readProjectAsset(normalizedStorageKey);

  if (!record?.blob) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_NOT_FOUND",

      message: `Project asset not found: ${normalizedStorageKey}`,

      publicMessage:
        "The Project file is no longer available in browser storage.",
    });
  }

  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_URL_UNAVAILABLE",

      message: "Object URLs are unavailable.",

      publicMessage:
        "The Project file cannot be previewed in this environment.",
    });
  }

  return URL.createObjectURL(record.blob);
}

/*
 * =========================================
 * Revoke Object URL
 * =========================================
 */

export function revokeProjectAssetUrl(objectUrl) {
  if (
    typeof objectUrl === "string" &&
    objectUrl.startsWith("blob:") &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(objectUrl);
  }
}

/*
 * =========================================
 * List Project Asset Metadata
 * =========================================
 *
 * Blob data is removed from the returned
 * records to avoid unnecessarily retaining
 * large file data in application state.
 */

export async function listProjectAssets(projectId, { kind = "all" } = {}) {
  const normalizedProjectId = getText(projectId);

  if (!normalizedProjectId) {
    return [];
  }

  const normalizedKind = kind === "media" || kind === "document" ? kind : "all";

  const database = await openProjectAssetDatabase();

  try {
    const transaction = database.transaction(
      PROJECT_ASSET_STORE_NAME,
      "readonly",
    );

    const store = transaction.objectStore(PROJECT_ASSET_STORE_NAME);

    const index = store.index(PROJECT_ID_INDEX_NAME);

    const records = await requestToPromise(index.getAll(normalizedProjectId));

    await transactionToPromise(transaction);

    return getArray(records)
      .filter(
        (record) => normalizedKind === "all" || record.kind === normalizedKind,
      )
      .map(createAssetMetadata);
  } catch (error) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_LIST_FAILED",

      message: "Unable to list Project assets.",

      publicMessage: "The Project file list could not be loaded.",

      cause: error,
    });
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Delete Assets by Storage Key
 * =========================================
 */

export async function deleteProjectAssets(storageKeys = []) {
  const normalizedStorageKeys = [
    ...new Set(getArray(storageKeys).map(getText).filter(Boolean)),
  ];

  if (normalizedStorageKeys.length === 0) {
    return 0;
  }

  const database = await openProjectAssetDatabase();

  try {
    const transaction = database.transaction(
      PROJECT_ASSET_STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(PROJECT_ASSET_STORE_NAME);

    normalizedStorageKeys.forEach((normalizedStorageKey) => {
      store.delete(normalizedStorageKey);
    });

    await transactionToPromise(transaction);

    return normalizedStorageKeys.length;
  } catch (error) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_DELETE_FAILED",

      message: "Unable to delete Project assets.",

      publicMessage: "One or more Project files could not be removed.",

      cause: error,
    });
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Delete All Assets for Project
 * =========================================
 *
 * A cursor is used instead of getAll(). This
 * prevents every large Blob from being loaded
 * into application memory before deletion.
 */

export async function deleteProjectAssetsForProject(projectId) {
  const normalizedProjectId = getText(projectId);

  if (!normalizedProjectId) {
    return 0;
  }

  const database = await openProjectAssetDatabase();

  try {
    const transaction = database.transaction(
      PROJECT_ASSET_STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(PROJECT_ASSET_STORE_NAME);

    const index = store.index(PROJECT_ID_INDEX_NAME);

    if (typeof IDBKeyRange === "undefined") {
      throw new Error("IDBKeyRange is unavailable.");
    }

    const keyRange = IDBKeyRange.only(normalizedProjectId);

    /*
     * This variable is updated while the cursor
     * deletes each matching Project asset.
     */

    let cursorDeletedCount = 0;

    const cursorPromise = new Promise((resolve, reject) => {
      const cursorRequest = index.openCursor(keyRange);

      cursorRequest.onerror = () => {
        reject(
          cursorRequest.error || new Error("The Project asset cursor failed."),
        );
      };

      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;

        /*
         * No cursor means every matching asset
         * has been processed.
         */

        if (!cursor) {
          resolve(cursorDeletedCount);

          return;
        }

        const deleteRequest = cursor.delete();

        deleteRequest.onerror = () => {
          reject(
            deleteRequest.error ||
              new Error("A Project asset could not be deleted."),
          );
        };

        deleteRequest.onsuccess = () => {
          cursorDeletedCount += 1;

          cursor.continue();
        };
      };
    });

    /*
     * Use a different variable name for the
     * resolved count to avoid redeclaration.
     */

    const [completedDeletedCount] = await Promise.all([
      cursorPromise,
      transactionToPromise(transaction),
    ]);

    return completedDeletedCount;
  } catch (error) {
    throw createProjectAssetStorageError({
      code: "PROJECT_ASSET_PROJECT_DELETE_FAILED",

      message: "Unable to delete Project assets.",

      publicMessage: "One or more Project files could not be removed.",

      cause: error,
    });
  } finally {
    database.close();
  }
}
