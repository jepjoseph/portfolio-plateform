import {
  createDocumentStorageKey,
  sanitizeDocumentFileName,
  validateDocumentFile,
} from "./documentUtils.js";

/*
 * =========================================
 * IndexedDB Configuration
 * =========================================
 */

const DOCUMENT_DATABASE_NAME = "portfolio-platform-documents";

const DOCUMENT_DATABASE_VERSION = 1;

const DOCUMENT_FILE_STORE = "document-files";

/*
 * =========================================
 * Storage Error
 * =========================================
 */

function createDocumentStorageError({
  message,
  publicMessage,
  code = "DOCUMENT_STORAGE_ERROR",
  cause = null,
}) {
  const error = new Error(message);

  error.name = "DocumentStorageError";

  error.code = code;

  error.publicMessage = publicMessage;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/*
 * =========================================
 * Browser Support
 * =========================================
 */

function getIndexedDb() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw createDocumentStorageError({
      message: "IndexedDB is unavailable.",

      publicMessage: "Document storage is not supported in this browser.",

      code: "DOCUMENT_STORAGE_UNAVAILABLE",
    });
  }

  return window.indexedDB;
}

/*
 * =========================================
 * Open Database
 * =========================================
 */

function openDocumentDatabase() {
  return new Promise((resolve, reject) => {
    let request;

    try {
      request = getIndexedDb().open(
        DOCUMENT_DATABASE_NAME,
        DOCUMENT_DATABASE_VERSION,
      );
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(DOCUMENT_FILE_STORE)) {
        const store = database.createObjectStore(DOCUMENT_FILE_STORE, {
          keyPath: "storageKey",
        });

        store.createIndex("recordId", "recordId", {
          unique: false,
        });

        store.createIndex("category", "category", {
          unique: false,
        });

        store.createIndex("uploadedAt", "uploadedAt", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        createDocumentStorageError({
          message: "Unable to open document storage.",

          publicMessage: "The document storage could not be opened.",

          cause: request.error,
        }),
      );
    };

    request.onblocked = () => {
      reject(
        createDocumentStorageError({
          message: "Document storage upgrade was blocked.",

          publicMessage:
            "Close other tabs using this application and try again.",

          code: "DOCUMENT_STORAGE_BLOCKED",
        }),
      );
    };
  });
}

/*
 * =========================================
 * Save File
 * =========================================
 */

export async function saveDocumentFile(
  file,
  { storageKey = "", recordId = "", category = "general" } = {},
) {
  const validation = validateDocumentFile(file);

  if (!validation.isValid) {
    const error = createDocumentStorageError({
      message: "The selected document is invalid.",

      publicMessage:
        validation.errors[0]?.message ||
        "The selected document cannot be uploaded.",

      code: "INVALID_DOCUMENT_FILE",
    });

    error.errors = validation.errors;

    throw error;
  }

  const resolvedStorageKey =
    storageKey || createDocumentStorageKey("document-file");

  const database = await openDocumentDatabase();

  const storedDocument = {
    storageKey: resolvedStorageKey,

    recordId: String(recordId || ""),

    category: String(category || "general"),

    fileName: sanitizeDocumentFileName(file.name),

    mimeType: file.type || "application/octet-stream",

    fileSize: file.size,

    lastModified: Number(file.lastModified) || Date.now(),

    uploadedAt: new Date().toISOString(),

    file,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DOCUMENT_FILE_STORE, "readwrite");

    const store = transaction.objectStore(DOCUMENT_FILE_STORE);

    store.put(storedDocument);

    transaction.oncomplete = () => {
      database.close();

      resolve({
        storageKey: storedDocument.storageKey,

        recordId: storedDocument.recordId,

        category: storedDocument.category,

        fileName: storedDocument.fileName,

        mimeType: storedDocument.mimeType,

        fileSize: storedDocument.fileSize,

        uploadedAt: storedDocument.uploadedAt,
      });
    };

    transaction.onerror = () => {
      const cause = transaction.error;

      database.close();

      reject(
        createDocumentStorageError({
          message: "Unable to save the document file.",

          publicMessage:
            "The selected document could not be saved in this browser.",

          cause,
        }),
      );
    };

    transaction.onabort = () => {
      const cause = transaction.error;

      database.close();

      reject(
        createDocumentStorageError({
          message: "The document file transaction was cancelled.",

          publicMessage: "The selected document could not be saved.",

          cause,
        }),
      );
    };
  });
}

/*
 * =========================================
 * Get File
 * =========================================
 */

export async function getStoredDocument(storageKey) {
  if (!storageKey) {
    throw createDocumentStorageError({
      message: "A document storage key is required.",

      publicMessage: "The document could not be identified.",

      code: "DOCUMENT_STORAGE_KEY_REQUIRED",
    });
  }

  const database = await openDocumentDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DOCUMENT_FILE_STORE, "readonly");

    const store = transaction.objectStore(DOCUMENT_FILE_STORE);

    const request = store.get(storageKey);

    request.onsuccess = () => {
      database.close();

      resolve(request.result || null);
    };

    request.onerror = () => {
      const cause = request.error;

      database.close();

      reject(
        createDocumentStorageError({
          message: `Unable to retrieve document "${storageKey}".`,

          publicMessage: "The document file could not be loaded.",

          cause,
        }),
      );
    };
  });
}

export async function getStoredDocumentFile(storageKey) {
  const storedDocument = await getStoredDocument(storageKey);

  return storedDocument?.file || null;
}

/*
 * =========================================
 * Object URL
 * =========================================
 */

export async function createStoredDocumentUrl(storageKey) {
  const file = await getStoredDocumentFile(storageKey);

  if (!file) {
    throw createDocumentStorageError({
      message: `Document "${storageKey}" was not found.`,

      publicMessage:
        "The document file is no longer available in this browser.",

      code: "DOCUMENT_FILE_NOT_FOUND",
    });
  }

  return URL.createObjectURL(file);
}

export function revokeDocumentUrl(objectUrl) {
  if (typeof objectUrl === "string" && objectUrl.startsWith("blob:")) {
    URL.revokeObjectURL(objectUrl);
  }
}

/*
 * =========================================
 * Delete File
 * =========================================
 */

export async function deleteStoredDocumentFile(storageKey) {
  if (!storageKey) {
    return {
      storageKey: "",
      deleted: false,
    };
  }

  const database = await openDocumentDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DOCUMENT_FILE_STORE, "readwrite");

    const store = transaction.objectStore(DOCUMENT_FILE_STORE);

    store.delete(storageKey);

    transaction.oncomplete = () => {
      database.close();

      resolve({
        storageKey,
        deleted: true,
      });
    };

    transaction.onerror = () => {
      const cause = transaction.error;

      database.close();

      reject(
        createDocumentStorageError({
          message: `Unable to delete document "${storageKey}".`,

          publicMessage: "The document file could not be removed.",

          cause,
        }),
      );
    };
  });
}

/*
 * =========================================
 * Delete Record Files
 * =========================================
 */

export async function deleteDocumentFilesForRecord(recordId) {
  if (!recordId) {
    return {
      recordId: "",
      deletedCount: 0,
    };
  }

  const database = await openDocumentDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DOCUMENT_FILE_STORE, "readwrite");

    const store = transaction.objectStore(DOCUMENT_FILE_STORE);

    const index = store.index("recordId");

    const request = index.openCursor(IDBKeyRange.only(recordId));

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (!cursor) {
        return;
      }

      cursor.delete();
      deletedCount += 1;
      cursor.continue();
    };

    transaction.oncomplete = () => {
      database.close();

      resolve({
        recordId,
        deletedCount,
      });
    };

    transaction.onerror = () => {
      const cause = transaction.error;

      database.close();

      reject(
        createDocumentStorageError({
          message: "Unable to remove record documents.",

          publicMessage: "Some supporting documents could not be removed.",

          cause,
        }),
      );
    };
  });
}
