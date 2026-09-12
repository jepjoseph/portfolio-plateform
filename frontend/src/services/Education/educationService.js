import {
  createEmptyEducation,
  createEducation as createEducationModel,
  normalizeEducation,
  normalizeEducationCollection,
  updateEducationModel,
} from "../../models/educationModel.js";

import { deleteStoredDocuments } from "../Documents/documentStorage.js";

import {
  assertValidEducation,
  validateEducation,
} from "./educationValidation.js";

import {
  readStoredEducation,
  replaceStoredEducation,
} from "./educationStorage.js";

/*
 * =========================================
 * Service Errors
 * =========================================
 */

function createEducationServiceError({
  message,
  publicMessage,
  code,
  status = 500,
  details = null,
}) {
  const error = new Error(message);

  error.name = "EducationServiceError";

  error.code = code;
  error.status = status;

  error.publicMessage = publicMessage;

  error.details = details;

  return error;
}

function createEducationNotFoundError(educationId) {
  return createEducationServiceError({
    message: `Education record "${educationId}" was not found.`,

    publicMessage: "The requested education record could not be found.",

    code: "EDUCATION_NOT_FOUND",

    status: 404,
  });
}

/*
 * =========================================
 * Candidate Creation
 * =========================================
 */

function createEducationCandidate(educationData = {}) {
  const defaults = createEmptyEducation();

  const source =
    educationData && typeof educationData === "object" ? educationData : {};

  return {
    ...defaults,
    ...source,

    institution: {
      ...defaults.institution,
      ...source.institution,
    },

    credential: {
      ...defaults.credential,
      ...source.credential,
    },

    location: {
      ...defaults.location,
      ...source.location,
    },

    dates: {
      ...defaults.dates,
      ...source.dates,
    },

    academic: {
      ...defaults.academic,
      ...source.academic,
    },

    visibility: {
      ...defaults.visibility,
      ...source.visibility,
    },

    privateInformation: {
      ...defaults.privateInformation,
      ...source.privateInformation,
    },
  };
}

/*
 * =========================================
 * Get Education Records
 * =========================================
 */

export async function getEducationRecords({ includeArchived = false } = {}) {
  const records = readStoredEducation();

  return includeArchived
    ? records
    : records.filter((education) => education.status !== "archived");
}

/*
 * Compatibility alias.
 */

export const getEducation = getEducationRecords;

/*
 * =========================================
 * Get Education By ID
 * =========================================
 */

export async function getEducationById(educationId) {
  if (!educationId) {
    throw createEducationServiceError({
      message: "An education ID is required.",

      publicMessage: "The education record could not be identified.",

      code: "EDUCATION_ID_REQUIRED",

      status: 400,
    });
  }

  const education = readStoredEducation().find(
    (record) => record.id === educationId,
  );

  if (!education) {
    throw createEducationNotFoundError(educationId);
  }

  return education;
}

/*
 * =========================================
 * Create Education
 * =========================================
 */

export async function createEducation(educationData) {
  const records = readStoredEducation();

  const candidate = createEducationCandidate(educationData);

  assertValidEducation(candidate);

  const education = createEducationModel(candidate);

  const duplicateId = records.some((record) => record.id === education.id);

  if (duplicateId) {
    throw createEducationServiceError({
      message: `Education ID "${education.id}" already exists.`,

      publicMessage:
        "This education record could not be created because its identifier already exists.",

      code: "EDUCATION_ID_CONFLICT",

      status: 409,
    });
  }

  replaceStoredEducation([education, ...records]);

  return education;
}

/*
 * =========================================
 * Update Education
 * =========================================
 */

export async function updateEducation(educationId, updates = {}) {
  if (!educationId) {
    throw createEducationServiceError({
      message: "An education ID is required.",

      publicMessage: "The education record could not be identified.",

      code: "EDUCATION_ID_REQUIRED",

      status: 400,
    });
  }

  const records = readStoredEducation();

  const recordIndex = records.findIndex(
    (education) => education.id === educationId,
  );

  if (recordIndex === -1) {
    throw createEducationNotFoundError(educationId);
  }

  const currentEducation = records[recordIndex];

  const safeUpdates = updates && typeof updates === "object" ? updates : {};

  const mergedEducation = {
    ...currentEducation,
    ...safeUpdates,

    institution: {
      ...currentEducation.institution,
      ...safeUpdates.institution,
    },

    credential: {
      ...currentEducation.credential,
      ...safeUpdates.credential,
    },

    location: {
      ...currentEducation.location,
      ...safeUpdates.location,
    },

    dates: {
      ...currentEducation.dates,
      ...safeUpdates.dates,
    },

    academic: {
      ...currentEducation.academic,
      ...safeUpdates.academic,
    },

    visibility: {
      ...currentEducation.visibility,
      ...safeUpdates.visibility,
    },

    privateInformation: {
      ...currentEducation.privateInformation,
      ...safeUpdates.privateInformation,
    },

    id: currentEducation.id,

    createdAt: currentEducation.createdAt,
  };

  assertValidEducation(mergedEducation);

  const updatedEducation = updateEducationModel(currentEducation, safeUpdates);

  const nextRecords = [...records];

  nextRecords[recordIndex] = updatedEducation;

  replaceStoredEducation(nextRecords);

  return updatedEducation;
}

/*
 * =========================================
 * Archive and Restore
 * =========================================
 */

export async function archiveEducation(educationId) {
  return updateEducation(educationId, {
    status: "archived",
  });
}

export async function restoreEducation(educationId) {
  return updateEducation(educationId, {
    status: "active",
  });
}

/*
 * =========================================
 * Supporting Document Keys
 * =========================================
 */

function getEducationDocumentStorageKeys(education) {
  const supportingDocuments = Array.isArray(education?.supportingDocuments)
    ? education.supportingDocuments
    : [];

  return [
    ...new Set(
      supportingDocuments
        .map((document) =>
          typeof document?.storageKey === "string"
            ? document.storageKey.trim()
            : "",
        )
        .filter(Boolean),
    ),
  ];
}

/*
 * =========================================
 * Delete Education
 * =========================================
 */

export async function deleteEducation(educationId) {
  if (!educationId) {
    throw createEducationServiceError({
      message: "An education ID is required.",

      publicMessage: "The education record could not be identified.",

      code: "EDUCATION_ID_REQUIRED",

      status: 400,
    });
  }

  /*
   * Step 1: Locate the record before deleting
   * either its metadata or document binaries.
   */

  const records = readStoredEducation();

  const recordToDelete = records.find(
    (education) => education.id === educationId,
  );

  if (!recordToDelete) {
    throw createEducationNotFoundError(educationId);
  }

  const credentialName =
    recordToDelete.credential?.name || "Unnamed Credential";

  const institutionName =
    recordToDelete.institution?.name || "Institution not provided";

  /*
   * Step 2: Collect unique valid IndexedDB keys.
   * Documents using external fileUrl values do not
   * belong to IndexedDB and are not deleted here.
   */

  const documentStorageKeys = getEducationDocumentStorageKeys(recordToDelete);

  let documentCleanup;

  /*
   * Step 3: Delete binary documents first.
   *
   * deleteStoredDocuments() uses one IndexedDB
   * transaction. If it fails, the transaction is
   * aborted and the Education metadata is preserved.
   */

  try {
    documentCleanup = await deleteStoredDocuments(documentStorageKeys);
  } catch (cleanupError) {
    throw createEducationServiceError({
      message:
        `Education record "${educationId}" was preserved because ` +
        "its supporting-document cleanup failed.",

      publicMessage:
        cleanupError?.publicMessage ||
        "The education record was not deleted because its supporting documents could not be removed.",

      code: "EDUCATION_DOCUMENT_CLEANUP_FAILED",

      status: 500,

      details: {
        educationId,

        credentialName,

        institutionName,

        phase: "document-cleanup",

        recordPreserved: true,

        documentStorageKeys,

        documents: cleanupError?.cleanup || {
          requested: documentStorageKeys.length,
          deleted: 0,
          failed: documentStorageKeys.length,
          missing: 0,
          deletedKeys: [],
          missingKeys: [],
          failures: [],
        },

        originalErrorCode: cleanupError?.code || "DOCUMENT_BULK_DELETE_FAILED",
      },
    });
  }

  /*
   * Step 4: Delete Education metadata only after
   * the IndexedDB transaction completes successfully.
   */

  const remainingRecords = records.filter(
    (education) => education.id !== educationId,
  );

  try {
    replaceStoredEducation(remainingRecords);
  } catch (storageError) {
    /*
     * IndexedDB and localStorage cannot share one
     * browser transaction. At this point the binary
     * files are gone, but the Education metadata may
     * still exist. Report this explicitly so a future
     * backend can support true transactional deletion.
     */

    throw createEducationServiceError({
      message:
        `Supporting documents for Education record "${educationId}" were ` +
        "deleted, but its localStorage metadata could not be removed.",

      publicMessage:
        "The supporting documents were removed, but the education record could not be fully deleted. Try the operation again.",

      code: "EDUCATION_DELETE_PARTIAL",

      status: 500,

      details: {
        educationId,

        credentialName,

        institutionName,

        phase: "metadata-deletion",

        recordMayRemain: true,

        documentsDeleted: true,

        documents: documentCleanup,

        deletedDocumentStorageKeys: documentCleanup.deletedKeys,

        missingDocumentStorageKeys: documentCleanup.missingKeys,

        originalErrorCode: storageError?.code || "EDUCATION_STORAGE_ERROR",
      },
    });
  }

  /*
   * Step 5: Return the complete deletion result.
   */

  return {
    id: educationId,

    credentialName,

    institutionName,

    deleted: true,

    documents: {
      requested: documentCleanup.requested,

      deleted: documentCleanup.deleted,

      failed: documentCleanup.failed,

      failures: documentCleanup.failures,
    },
  };
}

/*
 * =========================================
 * Draft Validation
 * =========================================
 */

export async function validateEducationDraft(educationData) {
  return validateEducation(createEducationCandidate(educationData));
}

/*
 * =========================================
 * Replace Collection
 * =========================================
 */

export async function replaceEducationRecords(educationValues) {
  if (!Array.isArray(educationValues)) {
    throw createEducationServiceError({
      message: "The replacement education collection must be an array.",

      publicMessage: "The education collection has an invalid format.",

      code: "INVALID_EDUCATION_COLLECTION",

      status: 400,
    });
  }

  const validatedRecords = educationValues.map((educationValue) => {
    const candidate = createEducationCandidate(educationValue);

    assertValidEducation(candidate);

    return normalizeEducation(candidate);
  });

  return replaceStoredEducation(normalizeEducationCollection(validatedRecords));
}
