import {
  CERTIFICATION_FIELD_LIMITS,
  getCertificationDocumentExtension,
  getCertificationDocumentPreviewMode,
  isCertificationDocumentWithinSizeLimit,
  isSupportedCertificationDocument,
} from "../../config/certificationConfig.js";

const CERTIFICATION_DOCUMENT_DATABASE_NAME =
  "portfolio-platform:certification-documents";

const CERTIFICATION_DOCUMENT_DATABASE_VERSION = 1;

const CERTIFICATION_DOCUMENT_STORE_NAME = "documents";

const CERTIFICATION_ID_INDEX_NAME = "certificationId";

/*
 * =========================================
 * Basic Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function createId(prefix = "certification-document") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isBlobValue(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

/*
 * =========================================
 * Storage Errors
 * =========================================
 */

function createCertificationDocumentStorageError(
  message,
  publicMessage,
  cause = null,
) {
  const error = new Error(message);

  error.name = "CertificationDocumentStorageError";
  error.code = "CERTIFICATION_DOCUMENT_STORAGE_ERROR";
  error.publicMessage = publicMessage;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

function createDocumentValidationError(message, publicMessage) {
  const error = createCertificationDocumentStorageError(message, publicMessage);

  error.code = "CERTIFICATION_DOCUMENT_VALIDATION_ERROR";

  return error;
}

/*
 * =========================================
 * IndexedDB Availability
 * =========================================
 */

function getIndexedDb() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw createCertificationDocumentStorageError(
      "IndexedDB is unavailable.",
      "Document storage is not supported in this browser.",
    );
  }

  return window.indexedDB;
}

/*
 * =========================================
 * File Validation
 * =========================================
 */

function validateDocumentFile(file) {
  if (!file || typeof file !== "object" || !isBlobValue(file)) {
    throw createDocumentValidationError(
      "The certification document is not a valid File or Blob.",
      "Select a valid certificate document.",
    );
  }

  if (!getText(file.name)) {
    throw createDocumentValidationError(
      "The certification document does not have a file name.",
      "The selected document must have a file name.",
    );
  }

  if (!isSupportedCertificationDocument(file)) {
    throw createDocumentValidationError(
      `Unsupported certification document: ${file.name}`,
      "Upload a PDF, Word document, JPG, PNG, or WebP image.",
    );
  }

  if (!isCertificationDocumentWithinSizeLimit(file)) {
    const maximumSize =
      CERTIFICATION_FIELD_LIMITS.maximumDocumentBytes / (1024 * 1024);

    throw createDocumentValidationError(
      `Invalid certification document size: ${file.size}`,
      `The document must be larger than 0 bytes and no larger than ${maximumSize} MB.`,
    );
  }
}

/*
 * =========================================
 * IndexedDB Request Helpers
 * =========================================
 */

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          createCertificationDocumentStorageError(
            "An IndexedDB request failed.",
            "The certificate document operation could not be completed.",
          ),
      );
    };
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ||
          createCertificationDocumentStorageError(
            "The IndexedDB transaction failed.",
            "The certificate document operation could not be completed.",
          ),
      );
    };

    transaction.onabort = () => {
      reject(
        transaction.error ||
          createCertificationDocumentStorageError(
            "The IndexedDB transaction was aborted.",
            "The certificate document operation was cancelled.",
          ),
      );
    };
  });
}

/*
 * =========================================
 * Open Database
 * =========================================
 */

function openCertificationDocumentDatabase() {
  const indexedDb = getIndexedDb();

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(
      CERTIFICATION_DOCUMENT_DATABASE_NAME,
      CERTIFICATION_DOCUMENT_DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      let store;

      if (
        !database.objectStoreNames.contains(CERTIFICATION_DOCUMENT_STORE_NAME)
      ) {
        store = database.createObjectStore(CERTIFICATION_DOCUMENT_STORE_NAME, {
          keyPath: "storageKey",
        });
      } else {
        store = request.transaction.objectStore(
          CERTIFICATION_DOCUMENT_STORE_NAME,
        );
      }

      if (!store.indexNames.contains(CERTIFICATION_ID_INDEX_NAME)) {
        store.createIndex(CERTIFICATION_ID_INDEX_NAME, "certificationId", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        createCertificationDocumentStorageError(
          "Unable to open the Certification document database.",
          "Certificate document storage could not be opened.",
          request.error,
        ),
      );
    };

    request.onblocked = () => {
      reject(
        createCertificationDocumentStorageError(
          "The Certification document database upgrade was blocked.",
          "Close other tabs using this portfolio and try again.",
        ),
      );
    };
  });
}

/*
 * =========================================
 * Storage Key
 * =========================================
 */

export function createCertificationDocumentStorageKey(
  certificationId = "",
  documentId = "",
) {
  const normalizedCertificationId = getText(certificationId);

  const normalizedDocumentId = getText(documentId);

  if (normalizedCertificationId && normalizedDocumentId) {
    return (
      `certification:${normalizedCertificationId}:` +
      `document:${normalizedDocumentId}`
    );
  }

  return createId("certification-document-storage");
}

/*
 * =========================================
 * Write Document
 * =========================================
 */

export async function writeCertificationDocument({
  file,
  certificationId = "",
  documentId = "",
  storageKey = "",
} = {}) {
  validateDocumentFile(file);

  const normalizedCertificationId = getText(certificationId);

  const normalizedDocumentId =
    getText(documentId) || createId("certification-document");

  const normalizedStorageKey =
    getText(storageKey) ||
    createCertificationDocumentStorageKey(
      normalizedCertificationId,
      normalizedDocumentId,
    );

  const database = await openCertificationDocumentDatabase();

  const timestamp = new Date().toISOString();

  /*
   * Store a Blob instead of the original File object.
   * The file name and type remain available in metadata.
   */

  const blob = file.slice(0, file.size, file.type);

  const record = {
    storageKey: normalizedStorageKey,

    certificationId: normalizedCertificationId,

    documentId: normalizedDocumentId,

    fileName: getText(file.name),

    extension: getCertificationDocumentExtension(file.name),

    mimeType: getText(file.type) || "application/octet-stream",

    size: Number(file.size) || 0,

    previewMode: getCertificationDocumentPreviewMode({
      fileName: file.name,
      mimeType: file.type,
    }),

    blob,

    createdAt: timestamp,
    updatedAt: timestamp,
  };

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME);

    const existingRecord = await requestToPromise(
      store.get(normalizedStorageKey),
    );

    if (existingRecord?.createdAt) {
      record.createdAt = existingRecord.createdAt;
    }

    store.put(record);

    await transactionToPromise(transaction);

    /*
     * Return metadata only.
     * Do not return the stored Blob as part of the
     * Certification model.
     */

    return {
      storageKey: record.storageKey,

      certificationId: record.certificationId,

      documentId: record.documentId,

      fileName: record.fileName,

      extension: record.extension,

      mimeType: record.mimeType,

      size: record.size,

      previewMode: record.previewMode,

      createdAt: record.createdAt,

      updatedAt: record.updatedAt,
    };
  } catch (error) {
    if (error?.name === "CertificationDocumentStorageError") {
      throw error;
    }

    throw createCertificationDocumentStorageError(
      "Unable to save the Certification document.",
      "The certificate document could not be saved.",
      error,
    );
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Read Document
 * =========================================
 */

export async function readCertificationDocument(storageKey) {
  const normalizedStorageKey = getText(storageKey);

  if (!normalizedStorageKey) {
    return null;
  }

  const database = await openCertificationDocumentDatabase();

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readonly",
    );

    const store = transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME);

    const record = await requestToPromise(store.get(normalizedStorageKey));

    await transactionToPromise(transaction);

    return record || null;
  } catch (error) {
    throw createCertificationDocumentStorageError(
      "Unable to read the Certification document.",
      "The certificate document could not be loaded.",
      error,
    );
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Read Blob
 * =========================================
 */

export async function readCertificationDocumentBlob(storageKey) {
  const record = await readCertificationDocument(storageKey);

  return record?.blob || null;
}

/*
 * =========================================
 * Object URL
 * =========================================
 */

export async function createCertificationDocumentUrl(storageKey) {
  const blob = await readCertificationDocumentBlob(storageKey);

  if (!blob) {
    return "";
  }

  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw createCertificationDocumentStorageError(
      "Object URLs are unavailable.",
      "The certificate document cannot be previewed in this environment.",
    );
  }

  return URL.createObjectURL(blob);
}

export function revokeCertificationDocumentUrl(objectUrl) {
  if (
    objectUrl &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(objectUrl);
  }
}

/*
 * =========================================
 * Delete One Document
 * =========================================
 */

export async function deleteCertificationDocument(storageKey) {
  const normalizedStorageKey = getText(storageKey);

  if (!normalizedStorageKey) {
    return false;
  }

  const database = await openCertificationDocumentDatabase();

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME);

    const existingRecord = await requestToPromise(
      store.get(normalizedStorageKey),
    );

    if (!existingRecord) {
      await transactionToPromise(transaction);

      return false;
    }

    store.delete(normalizedStorageKey);

    await transactionToPromise(transaction);

    return true;
  } catch (error) {
    throw createCertificationDocumentStorageError(
      "Unable to delete the Certification document.",
      "The certificate document could not be deleted.",
      error,
    );
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Delete Multiple Documents
 * =========================================
 */

export async function deleteCertificationDocuments(storageKeys = []) {
  const keys = [...new Set(getArray(storageKeys).map(getText).filter(Boolean))];

  if (keys.length === 0) {
    return 0;
  }

  const database = await openCertificationDocumentDatabase();

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME);

    keys.forEach((key) => {
      store.delete(key);
    });

    await transactionToPromise(transaction);

    return keys.length;
  } catch (error) {
    throw createCertificationDocumentStorageError(
      "Unable to delete Certification documents.",
      "One or more certificate documents could not be deleted.",
      error,
    );
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Read Certification Documents
 * =========================================
 */

export async function readCertificationDocuments(certificationId) {
  const normalizedCertificationId = getText(certificationId);

  if (!normalizedCertificationId) {
    return [];
  }

  const database = await openCertificationDocumentDatabase();

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readonly",
    );

    const store = transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME);

    const index = store.index(CERTIFICATION_ID_INDEX_NAME);

    const records = await requestToPromise(
      index.getAll(normalizedCertificationId),
    );

    await transactionToPromise(transaction);

    return Array.isArray(records) ? records : [];
  } catch (error) {
    throw createCertificationDocumentStorageError(
      "Unable to read Certification documents.",
      "The certificate documents could not be loaded.",
      error,
    );
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Delete Certification Documents
 * =========================================
 */

export async function deleteCertificationDocumentsForCertification(
  certificationId,
) {
  const records = await readCertificationDocuments(certificationId);

  return deleteCertificationDocuments(
    records.map((record) => record.storageKey),
  );
}

/*
 * =========================================
 * Clear Document Storage
 * =========================================
 */

export async function clearCertificationDocumentStorage() {
  const database = await openCertificationDocumentDatabase();

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readwrite",
    );

    transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME).clear();

    await transactionToPromise(transaction);
  } catch (error) {
    throw createCertificationDocumentStorageError(
      "Unable to clear Certification document storage.",
      "The saved certificate documents could not be cleared.",
      error,
    );
  } finally {
    database.close();
  }
}

/*
 * =========================================
 * Storage Information
 * =========================================
 */

export async function getCertificationDocumentStorageInformation() {
  const database = await openCertificationDocumentDatabase();

  try {
    const transaction = database.transaction(
      CERTIFICATION_DOCUMENT_STORE_NAME,
      "readonly",
    );

    const store = transaction.objectStore(CERTIFICATION_DOCUMENT_STORE_NAME);

    const documentCount = await requestToPromise(store.count());

    await transactionToPromise(transaction);

    return {
      databaseName: CERTIFICATION_DOCUMENT_DATABASE_NAME,

      databaseVersion: CERTIFICATION_DOCUMENT_DATABASE_VERSION,

      storeName: CERTIFICATION_DOCUMENT_STORE_NAME,

      documentCount,
    };
  } catch (error) {
    throw createCertificationDocumentStorageError(
      "Unable to inspect Certification document storage.",
      "Certificate document storage information could not be loaded.",
      error,
    );
  } finally {
    database.close();
  }
}
