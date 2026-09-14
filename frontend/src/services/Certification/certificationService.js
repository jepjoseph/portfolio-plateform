import {
  createCertification as createCertificationModel,
  createCertificationDocument,
  createPublicCertification,
  normalizeCertification,
  updateCertification as updateCertificationModel,
} from "../../models/certificationModel.js";

import {
  deleteCertificationDocument,
  deleteCertificationDocuments,
  deleteCertificationDocumentsForCertification,
  readCertificationDocument,
  writeCertificationDocument,
} from "./certificationDocumentStorage.js";

import {
  readStoredCertifications,
} from "./certificationStorage.js";

import { validateCertification } from "./certificationValidation.js";

import { saveCertificationWithTrainingSync } from "./certificationTrainingRelationshipService.js";

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

function normalizeComparisonText(value) {
  return getText(value).normalize("NFKC").toLocaleLowerCase();
}

/*
 * =========================================
 * Service Errors
 * =========================================
 */

function createCertificationServiceError(
  code,
  message,
  publicMessage,
  details = {},
  cause = null,
) {
  const error = new Error(message);

  error.name = "CertificationServiceError";
  error.code = code;
  error.publicMessage = publicMessage;

  Object.assign(error, details);

  if (cause) {
    error.cause = cause;
  }

  return error;
}

function createNotFoundError(certificationId) {
  return createCertificationServiceError(
    "CERTIFICATION_NOT_FOUND",
    `Certification not found: ${certificationId}`,
    "The selected certification could not be found.",
    {
      certificationId,
    },
  );
}

function createValidationError(validation) {
  return createCertificationServiceError(
    "CERTIFICATION_VALIDATION_ERROR",
    "Certification validation failed.",
    "Correct the highlighted certification fields before saving.",
    {
      validation,
      errors: validation.errors,
      warnings: validation.warnings,
      fieldErrors: validation.fieldErrors,
    },
  );
}

function createDuplicateError(certification) {
  return createCertificationServiceError(
    "CERTIFICATION_DUPLICATE",
    `Matching certification already exists: ${certification.id}`,
    "A certification with the same name and issuing organization already exists.",
    {
      certification,

      fieldErrors: {
        name: "A matching certification already exists.",
      },
    },
  );
}

/*
 * =========================================
 * Collection Helpers
 * =========================================
 */

function findCertificationIndex(certifications, certificationId) {
  return certifications.findIndex(
    (certification) => certification.id === certificationId,
  );
}

function findMatchingCertification(
  certifications,
  candidate,
  excludedCertificationId = "",
) {
  const candidateName = normalizeComparisonText(candidate.name);

  const candidateIssuer = normalizeComparisonText(
    candidate.issuingOrganization?.name,
  );

  if (!candidateName || !candidateIssuer) {
    return null;
  }

  return (
    certifications.find((certification) => {
      if (certification.id === excludedCertificationId) {
        return false;
      }

      const certificationName = normalizeComparisonText(certification.name);

      const certificationIssuer = normalizeComparisonText(
        certification.issuingOrganization?.name,
      );

      return (
        certificationName === candidateName &&
        certificationIssuer === candidateIssuer
      );
    }) || null
  );
}

function getDocumentStorageKeys(certification) {
  return getArray(certification?.supportingDocuments)
    .map((document) => getText(document?.storageKey))
    .filter(Boolean);
}

function getRemovedDocumentStorageKeys(
  currentCertification,
  nextCertification,
) {
  const nextStorageKeys = new Set(getDocumentStorageKeys(nextCertification));

  return getDocumentStorageKeys(currentCertification).filter(
    (storageKey) => !nextStorageKeys.has(storageKey),
  );
}

/*
 * =========================================
 * Validation
 * =========================================
 */

function validateForSave(
  certification,
  { skills = null, trainingRecords = null, educationRecords = null } = {},
) {
  const validation = validateCertification(certification, {
    skills,
    trainingRecords,
    educationRecords,
  });

  if (!validation.isValid) {
    throw createValidationError(validation);
  }

  return validation;
}

/*
 * =========================================
 * Document Cleanup
 * =========================================
 */

async function rollbackStoredDocuments(storageKeys = []) {
  await Promise.allSettled(
    storageKeys.map((storageKey) => deleteCertificationDocument(storageKey)),
  );
}

async function removeUnusedDocuments(storageKeys = []) {
  if (storageKeys.length === 0) {
    return;
  }

  try {
    await deleteCertificationDocuments(storageKeys);
  } catch {
    /*
     * Certification metadata has already been saved.
     *
     * A failed binary cleanup should not make the
     * interface report that the Certification save
     * itself failed.
     *
     * Orphaned IndexedDB files can be removed later
     * through a maintenance operation.
     */
  }
}

/*
 * =========================================
 * Store Uploaded Documents
 * =========================================
 */

async function storeDocumentUploads(certificationId, uploads = []) {
  const documents = [];
  const storageKeys = [];

  try {
    for (const [index, upload] of getArray(uploads).entries()) {
      if (!upload?.file) {
        throw createCertificationServiceError(
          "CERTIFICATION_DOCUMENT_FILE_REQUIRED",
          `Document upload ${index} does not contain a file.`,
          "Select a file for every certificate document.",
        );
      }

      const metadata = upload.metadata || {};

      const stored = await writeCertificationDocument({
        file: upload.file,

        certificationId,

        documentId: upload.documentId || metadata.id,

        storageKey: upload.storageKey || metadata.storageKey,
      });

      storageKeys.push(stored.storageKey);

      const document = createCertificationDocument(
        {
          ...metadata,

          id: stored.documentId,

          documentType:
            upload.documentType || metadata.documentType || "certificate",

          name: upload.name || metadata.name || stored.fileName,

          description: upload.description || metadata.description || "",

          fileName: stored.fileName,
          extension: stored.extension,
          mimeType: stored.mimeType,
          size: stored.size,
          storageKey: stored.storageKey,
          previewMode: stored.previewMode,

          isPrimary: upload.isPrimary ?? metadata.isPrimary ?? false,

          createdAt: stored.createdAt,
          updatedAt: stored.updatedAt,
          uploadedAt: stored.updatedAt,
        },
        index,
      );

      documents.push(document);
    }

    return {
      documents,
      storageKeys,
    };
  } catch (error) {
    await rollbackStoredDocuments(storageKeys);

    throw error;
  }
}

/*
 * =========================================
 * Read Certifications
 * =========================================
 */

export function getCertifications({ includeArchived = false } = {}) {
  const certifications = readStoredCertifications();

  if (includeArchived) {
    return certifications;
  }

  return certifications.filter(
    (certification) => certification.status !== "archived",
  );
}

export function getCertificationById(
  certificationId,
  { includeArchived = true } = {},
) {
  const normalizedId = getText(certificationId);

  if (!normalizedId) {
    return null;
  }

  const certification =
    readStoredCertifications().find((record) => record.id === normalizedId) ||
    null;

  if (certification?.status === "archived" && !includeArchived) {
    return null;
  }

  return certification;
}

/*
 * =========================================
 * Public Certification Output
 * =========================================
 */

export function getPublicCertifications() {
  return getCertifications().map(createPublicCertification);
}

export function getPublicCertificationById(certificationId) {
  const certification = getCertificationById(certificationId, {
    includeArchived: false,
  });

  return certification ? createPublicCertification(certification) : null;
}

/*
 * =========================================
 * Create Certification
 * =========================================
 */

export async function createCertification(
  certificationData,
  {
    documentUploads = [],
    skills = null,
    trainingRecords = null,
    educationRecords = null,
  } = {},
) {
  const certifications = readStoredCertifications();

  let certification = createCertificationModel(certificationData);

  const stored = await storeDocumentUploads(certification.id, documentUploads);

  if (stored.documents.length > 0) {
    certification = normalizeCertification({
      ...certification,

      supportingDocuments: [
        ...certification.supportingDocuments,
        ...stored.documents,
      ],
    });
  }

  try {
    const validation = validateForSave(certification, {
      skills,
      trainingRecords,
      educationRecords,
    });

    const duplicate = findMatchingCertification(
      certifications,
      validation.certification,
    );

    if (duplicate) {
      throw createDuplicateError(duplicate);
    }

    const transaction = saveCertificationWithTrainingSync({
      certificationRecords: [...certifications, validation.certification],

      changedCertificationIds: [validation.certification.id],
    });

    const savedCertification =
      transaction.certificationRecords.find(
        (record) => record.id === validation.certification.id,
      ) || validation.certification;

    return {
      certification: savedCertification,
      warnings: validation.warnings,
    };
  } catch (error) {
    await rollbackStoredDocuments(stored.storageKeys);

    throw error;
  }
}

/*
 * =========================================
 * Update Certification
 * =========================================
 */

export async function updateCertification(
  certificationId,
  certificationData,
  {
    documentUploads = [],
    skills = null,
    trainingRecords = null,
    educationRecords = null,
  } = {},
) {
  const normalizedId = getText(certificationId);

  const certifications = readStoredCertifications();

  const certificationIndex = findCertificationIndex(
    certifications,
    normalizedId,
  );

  if (certificationIndex < 0) {
    throw createNotFoundError(normalizedId);
  }

  const currentCertification = certifications[certificationIndex];

  let nextCertification = updateCertificationModel(
    currentCertification,
    certificationData,
  );

  const stored = await storeDocumentUploads(normalizedId, documentUploads);

  if (stored.documents.length > 0) {
    nextCertification = normalizeCertification({
      ...nextCertification,

      supportingDocuments: [
        ...nextCertification.supportingDocuments,
        ...stored.documents,
      ],
    });
  }

  try {
    const validation = validateForSave(nextCertification, {
      skills,
      trainingRecords,
      educationRecords,
    });

    const duplicate = findMatchingCertification(
      certifications,
      validation.certification,
      normalizedId,
    );

    if (duplicate) {
      throw createDuplicateError(duplicate);
    }

    const removedStorageKeys = getRemovedDocumentStorageKeys(
      currentCertification,
      validation.certification,
    );

    const nextCertifications = [...certifications];

    nextCertifications[certificationIndex] = validation.certification;

    const transaction = saveCertificationWithTrainingSync({
      certificationRecords: nextCertifications,

      changedCertificationIds: [validation.certification.id],
    });

    await removeUnusedDocuments(removedStorageKeys);

    const savedCertification =
      transaction.certificationRecords.find(
        (record) => record.id === validation.certification.id,
      ) || validation.certification;

    return {
      certification: savedCertification,
      warnings: validation.warnings,
    };
  } catch (error) {
    await rollbackStoredDocuments(stored.storageKeys);

    throw error;
  }
}

/*
 * =========================================
 * Archive Certification
 * =========================================
 */

export async function archiveCertification(certificationId) {
  const certification = getCertificationById(certificationId);

  if (!certification) {
    throw createNotFoundError(getText(certificationId));
  }

  if (certification.status === "archived") {
    return certification;
  }

  const certifications = readStoredCertifications();

  const certificationIndex = findCertificationIndex(
    certifications,
    certification.id,
  );

  const archivedCertification = normalizeCertification({
    ...certification,

    status: "archived",

    updatedAt: new Date().toISOString(),
  });

  certifications[certificationIndex] = archivedCertification;

  const transaction = saveCertificationWithTrainingSync({
    certificationRecords: certifications,

    changedCertificationIds: [archivedCertification.id],
  });

  return (
    transaction.certificationRecords.find(
      (record) => record.id === archivedCertification.id,
    ) || archivedCertification
  );
}

/*
 * =========================================
 * Restore Certification
 * =========================================
 */

export async function restoreCertification(certificationId) {
  const certification = getCertificationById(certificationId);

  if (!certification) {
    throw createNotFoundError(getText(certificationId));
  }

  if (certification.status !== "archived") {
    return certification;
  }

  const certifications = readStoredCertifications();

  const duplicate = findMatchingCertification(
    certifications,
    certification,
    certification.id,
  );

  if (duplicate && duplicate.status !== "archived") {
    throw createDuplicateError(duplicate);
  }

  const certificationIndex = findCertificationIndex(
    certifications,
    certification.id,
  );

  const restoredCertification = normalizeCertification({
    ...certification,

    status: "active",

    updatedAt: new Date().toISOString(),
  });

  certifications[certificationIndex] = restoredCertification;

  const transaction = saveCertificationWithTrainingSync({
    certificationRecords: certifications,

    changedCertificationIds: [restoredCertification.id],
  });

  return (
    transaction.certificationRecords.find(
      (record) => record.id === restoredCertification.id,
    ) || restoredCertification
  );
}

/*
 * =========================================
 * Delete Certification
 * =========================================
 */

export async function deleteCertification(certificationId) {
  const normalizedId = getText(certificationId);

  const certifications = readStoredCertifications();

  const certificationIndex = findCertificationIndex(
    certifications,
    normalizedId,
  );

  if (certificationIndex < 0) {
    throw createNotFoundError(normalizedId);
  }

  const certification = certifications[certificationIndex];

  const nextCertifications = certifications.filter(
    (record) => record.id !== normalizedId,
  );

  /*
   * Remove the metadata first.
   *
   * If IndexedDB cleanup fails, the deleted
   * Certification does not reappear.
   */

  saveCertificationWithTrainingSync({
    certificationRecords: nextCertifications,

    deletedCertificationIds: [normalizedId],
  });

  try {
    await deleteCertificationDocumentsForCertification(normalizedId);
  } catch {
    await removeUnusedDocuments(getDocumentStorageKeys(certification));
  }

  return certification;
}

/*
 * =========================================
 * Add Document
 * =========================================
 */

export async function addCertificationDocument(
  certificationId,
  file,
  documentInformation = {},
  validationCollections = {},
) {
  const certification = getCertificationById(certificationId);

  if (!certification) {
    throw createNotFoundError(getText(certificationId));
  }

  const hasActiveDocument = certification.supportingDocuments.some(
    (document) => document.status !== "archived",
  );

  return updateCertification(certification.id, certification, {
    ...validationCollections,

    documentUploads: [
      {
        file,

        metadata: documentInformation,

        isPrimary: documentInformation.isPrimary ?? !hasActiveDocument,
      },
    ],
  });
}

/*
 * =========================================
 * Remove Document
 * =========================================
 */

export async function removeCertificationDocument(
  certificationId,
  documentId,
  validationCollections = {},
) {
  const certification = getCertificationById(certificationId);

  if (!certification) {
    throw createNotFoundError(getText(certificationId));
  }

  const normalizedDocumentId = getText(documentId);

  const document = certification.supportingDocuments.find(
    (item) => item.id === normalizedDocumentId,
  );

  if (!document) {
    throw createCertificationServiceError(
      "CERTIFICATION_DOCUMENT_NOT_FOUND",
      `Certification document not found: ${normalizedDocumentId}`,
      "The selected certificate document could not be found.",
      {
        certificationId: certification.id,

        documentId: normalizedDocumentId,
      },
    );
  }

  const supportingDocuments = certification.supportingDocuments.filter(
    (item) => item.id !== normalizedDocumentId,
  );

  return updateCertification(
    certification.id,
    {
      ...certification,
      supportingDocuments,
    },
    validationCollections,
  );
}

/*
 * =========================================
 * Set Primary Preview Document
 * =========================================
 */

export async function setPrimaryCertificationDocument(
  certificationId,
  documentId,
  validationCollections = {},
) {
  const certification = getCertificationById(certificationId);

  if (!certification) {
    throw createNotFoundError(getText(certificationId));
  }

  const normalizedDocumentId = getText(documentId);

  const selectedDocument = certification.supportingDocuments.find(
    (document) =>
      document.id === normalizedDocumentId && document.status !== "archived",
  );

  if (!selectedDocument) {
    throw createCertificationServiceError(
      "CERTIFICATION_DOCUMENT_NOT_FOUND",
      `Active Certification document not found: ${normalizedDocumentId}`,
      "The selected document could not be used as the preview.",
    );
  }

  const supportingDocuments = certification.supportingDocuments.map(
    (document) => ({
      ...document,

      isPrimary:
        document.id === normalizedDocumentId && document.status !== "archived",
    }),
  );

  return updateCertification(
    certification.id,
    {
      ...certification,
      supportingDocuments,
    },
    validationCollections,
  );
}

/*
 * =========================================
 * Replace Document File
 * =========================================
 */

export async function replaceCertificationDocumentFile(
  certificationId,
  documentId,
  file,
  validationCollections = {},
) {
  const certification = getCertificationById(certificationId);

  if (!certification) {
    throw createNotFoundError(getText(certificationId));
  }

  const normalizedDocumentId = getText(documentId);

  const currentDocument = certification.supportingDocuments.find(
    (document) => document.id === normalizedDocumentId,
  );

  if (!currentDocument) {
    throw createCertificationServiceError(
      "CERTIFICATION_DOCUMENT_NOT_FOUND",
      `Certification document not found: ${normalizedDocumentId}`,
      "The selected certificate document could not be found.",
    );
  }

  /*
   * Preserve the existing document so it can be
   * restored if metadata validation fails.
   */

  const previousStoredDocument = await readCertificationDocument(
    currentDocument.storageKey,
  );

  const stored = await writeCertificationDocument({
    file,

    certificationId: certification.id,

    documentId: currentDocument.id,

    storageKey: currentDocument.storageKey,
  });

  const replacement = createCertificationDocument({
    ...currentDocument,

    fileName: stored.fileName,
    extension: stored.extension,
    mimeType: stored.mimeType,
    size: stored.size,
    storageKey: stored.storageKey,
    previewMode: stored.previewMode,

    updatedAt: stored.updatedAt,

    uploadedAt: stored.updatedAt,
  });

  const supportingDocuments = certification.supportingDocuments.map(
    (document) =>
      document.id === normalizedDocumentId ? replacement : document,
  );

  try {
    return await updateCertification(
      certification.id,
      {
        ...certification,
        supportingDocuments,
      },
      validationCollections,
    );
  } catch (error) {
    /*
     * Restore the previous Blob if updating the
     * Certification metadata fails.
     */

    if (previousStoredDocument?.blob && typeof File !== "undefined") {
      const previousFile = new File(
        [previousStoredDocument.blob],
        previousStoredDocument.fileName,
        {
          type: previousStoredDocument.mimeType,
        },
      );

      await writeCertificationDocument({
        file: previousFile,

        certificationId: certification.id,

        documentId: currentDocument.id,

        storageKey: currentDocument.storageKey,
      }).catch(() => {});
    }

    throw error;
  }
}
