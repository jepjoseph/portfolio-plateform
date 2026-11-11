import {
  createEmptyTraining,
  createTraining as createTrainingModel,
  normalizeTraining,
  normalizeTrainingCollection,
  updateTrainingModel,
} from "../../models/trainingModel.js";

import { deleteStoredDocuments } from "../Documents/documentStorage.js";

import { assertValidTraining, validateTraining } from "./trainingValidation.js";

import { readStoredTraining } from "./trainingStorage.js";

import {
  fetchTrainings,
  fetchTrainingById,
  createTrainingApi,
  updateTrainingApi,
  unlinkTrainingCertificationApi,
  linkTrainingCertificationApi,
} from "./trainingApiService.js";

import { saveTrainingWithCertificationSync } from "../Certification/certificationTrainingRelationshipService.js";

function createTrainingServiceError({
  message,
  publicMessage,
  code,
  status = 500,
  details = null,
}) {
  const error = new Error(message);

  error.name = "TrainingServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  error.details = details;

  return error;
}

function createTrainingNotFoundError(trainingId) {
  return createTrainingServiceError({
    message: `Training record "${trainingId}" was not found.`,
    publicMessage: "The requested training record could not be found.",
    code: "TRAINING_NOT_FOUND",
    status: 404,
  });
}

function createTrainingCandidate(trainingData = {}) {
  const defaults = createEmptyTraining();

  const source =
    trainingData && typeof trainingData === "object" ? trainingData : {};

  return {
    ...defaults,
    ...source,

    provider: {
      ...defaults.provider,
      ...source.provider,
    },

    delivery: {
      ...defaults.delivery,
      ...source.delivery,

      location: {
        ...defaults.delivery.location,
        ...source.delivery?.location,
      },
    },

    dates: {
      ...defaults.dates,
      ...source.dates,
    },

    completion: {
      ...defaults.completion,
      ...source.completion,
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

export async function getTrainingRecords({ includeArchived = false } = {}) {
  const records = await fetchTrainings();

  return includeArchived
    ? records
    : records.filter((training) => training.status !== "archived");
}

export const getTraining = getTrainingRecords;

export async function getTrainingById(trainingId) {
  if (!trainingId) {
    throw createTrainingServiceError({
      message: "A training ID is required.",
      publicMessage: "The training record could not be identified.",
      code: "TRAINING_ID_REQUIRED",
      status: 400,
    });
  }

  return fetchTrainingById(trainingId);
}

const TRAINING_PROTECTED_FIELDS = [
  "skillRelationships",
  "supportingDocuments",
  "relatedEducationIds",
  "certificationRelationships",
  "relatedCertificationIds",
  "relatedExperienceIds",
  "relatedProjectIds",
];

const TRAINING_EDITABLE_FIELDS = [
  "title",
  "trainingType",
  "provider",
  "delivery",
  "dates",
  "completion",
  "description",
  "instructors",
  "topics",
  "learningOutcomes",
  "visibility",
  "privateInformation",
  "source",
  "sourceContext",
  "status",
];

function assertProtectedTrainingFieldsUnchanged(candidate, original) {
  const changed = TRAINING_PROTECTED_FIELDS.filter(
    (field) =>
      JSON.stringify(candidate[field]) !== JSON.stringify(original[field]),
  );

  if (changed.length) {
    throw createTrainingServiceError({
      message: `Unsupported Training changes: ${changed.join(", ")}`,
      publicMessage:
        "Document and relationship changes are not available yet. No changes were saved.",
      code: "TRAINING_RELATIONSHIP_OR_DOCUMENT_WRITE_NOT_READY",
      status: 409,
      details: { fields: changed },
    });
  }
}

function assertNoNewTrainingRelationshipsOrDocuments(candidate) {
  const unsupported = TRAINING_PROTECTED_FIELDS.filter(
    (field) => Array.isArray(candidate[field]) && candidate[field].length > 0,
  );

  if (unsupported.length) {
    throw createTrainingServiceError({
      message: `Unsupported Training creation fields: ${unsupported.join(", ")}`,
      publicMessage:
        "Create this Training without documents or relationships. Those features are not connected to backend persistence yet.",
      code: "TRAINING_RELATIONSHIP_OR_DOCUMENT_WRITE_NOT_READY",
      status: 409,
      details: { fields: unsupported },
    });
  }
}

export async function createTraining(trainingData) {
  const candidate = createTrainingCandidate(trainingData);

  assertValidTraining(candidate);

  const normalized = normalizeTraining(candidate);

  assertNoNewTrainingRelationshipsOrDocuments(normalized);

  return createTrainingApi(normalized);
}

export async function updateTraining(
  trainingId,
  updates = {},
  editMetadata = {},
) {
  if (!trainingId) {
    throw createTrainingServiceError({
      message: "A training ID is required.",
      publicMessage: "The training record could not be identified.",
      code: "TRAINING_ID_REQUIRED",
      status: 400,
    });
  }

  const { rowVersion, originalTraining } = editMetadata;

  if (
    typeof rowVersion !== "string" ||
    !rowVersion.trim() ||
    !originalTraining ||
    originalTraining.id !== trainingId ||
    originalTraining.rowVersion !== rowVersion
  ) {
    throw createTrainingServiceError({
      message: "The original SQL Training version is unavailable.",
      publicMessage:
        "The original Training version is missing. Close the editor, refresh the Training Library, and reopen the record.",
      code: "TRAINING_ORIGINAL_VERSION_REQUIRED",
      status: 409,
    });
  }

  const original = normalizeTraining(originalTraining);

  const candidate = normalizeTraining(
    createTrainingCandidate({
      ...originalTraining,
      ...updates,
    }),
  );

  assertProtectedTrainingFieldsUnchanged(candidate, original);

  const changedFields = Object.fromEntries(
    TRAINING_EDITABLE_FIELDS
      .filter(
        (field) =>
          JSON.stringify(candidate[field]) !== JSON.stringify(original[field]),
      )
      .map((field) => [field, candidate[field]]),
  );

  if (Object.keys(changedFields).length === 0) {
    return originalTraining;
  }

  assertValidTraining(candidate);

  return updateTrainingApi(trainingId, changedFields, rowVersion);
}
export async function archiveTraining(trainingId) {
  throw createTrainingServiceError({
    message: "Training writes are temporarily disabled during backend migration.",
    publicMessage:
      "Training changes are temporarily unavailable while backend persistence is being connected.",
    code: "TRAINING_BACKEND_WRITE_NOT_READY",
    status: 503,
  });

  return updateTraining(trainingId, {
    status: "archived",
  });
}

export async function restoreTraining(trainingId) {
  throw createTrainingServiceError({
    message: "Training writes are temporarily disabled during backend migration.",
    publicMessage:
      "Training changes are temporarily unavailable while backend persistence is being connected.",
    code: "TRAINING_BACKEND_WRITE_NOT_READY",
    status: 503,
  });

  return updateTraining(trainingId, {
    status: "active",
  });
}

function getTrainingDocumentStorageKeys(training) {
  const documents = Array.isArray(training?.supportingDocuments)
    ? training.supportingDocuments
    : [];

  return [
    ...new Set(
      documents
        .map((document) =>
          typeof document?.storageKey === "string"
            ? document.storageKey.trim()
            : "",
        )
        .filter(Boolean),
    ),
  ];
}

export async function deleteTraining(trainingId) {
  throw createTrainingServiceError({
    message: "Training writes are temporarily disabled during backend migration.",
    publicMessage:
      "Training changes are temporarily unavailable while backend persistence is being connected.",
    code: "TRAINING_BACKEND_WRITE_NOT_READY",
    status: 503,
  });

  if (!trainingId) {
    throw createTrainingServiceError({
      message: "A training ID is required.",
      publicMessage: "The training record could not be identified.",
      code: "TRAINING_ID_REQUIRED",
      status: 400,
    });
  }

  const records = readStoredTraining();

  const recordToDelete = records.find((training) => training.id === trainingId);

  if (!recordToDelete) {
    throw createTrainingNotFoundError(trainingId);
  }

  const storageKeys = getTrainingDocumentStorageKeys(recordToDelete);

  const remainingRecords = records.filter(
    (training) => training.id !== trainingId,
  );

  /*
   * Remove Training metadata and reciprocal
   * Certification links first.
   */

  saveTrainingWithCertificationSync({
    trainingRecords: remainingRecords,

    deletedTrainingIds: [trainingId],
  });

  let documentCleanup = null;

  try {
    documentCleanup = await deleteStoredDocuments(storageKeys);
  } catch (cleanupError) {
    /*
     * Metadata and relationships are already
     * consistently deleted. Failed binary cleanup
     * can be handled later as orphan maintenance.
     */

    documentCleanup = {
      completed: false,
      storageKeys,
      error:
        cleanupError?.publicMessage ||
        cleanupError?.message ||
        "Document cleanup failed.",
    };
  }

  return {
    id: trainingId,
    title: recordToDelete.title,
    providerName: recordToDelete.provider?.name || "",
    deleted: true,
    documents: documentCleanup,
  };
}

export async function validateTrainingDraft(
  trainingData,
  validationOptions = {},
) {
  return validateTraining(
    createTrainingCandidate(trainingData),
    validationOptions,
  );
}

export async function replaceTrainingRecords(trainingValues) {
  throw createTrainingServiceError({
    message: "Training writes are temporarily disabled during backend migration.",
    publicMessage:
      "Training changes are temporarily unavailable while backend persistence is being connected.",
    code: "TRAINING_BACKEND_WRITE_NOT_READY",
    status: 503,
  });

  if (!Array.isArray(trainingValues)) {
    throw createTrainingServiceError({
      message: "The replacement Training Library must be an array.",

      publicMessage: "The Training Library has an invalid format.",

      code: "INVALID_TRAINING_COLLECTION",

      status: 400,
    });
  }

  const currentRecords = readStoredTraining();

  const validatedRecords = trainingValues.map((value) => {
    const candidate = createTrainingCandidate(value);

    assertValidTraining(candidate);

    return normalizeTraining(candidate);
  });

  const normalizedRecords = normalizeTrainingCollection(validatedRecords);

  const nextTrainingIds = new Set(
    normalizedRecords.map((training) => training.id),
  );

  const deletedTrainingIds = currentRecords
    .map((training) => training.id)
    .filter((trainingId) => !nextTrainingIds.has(trainingId));

  const transaction = saveTrainingWithCertificationSync({
    trainingRecords: normalizedRecords,

    changedTrainingIds: normalizedRecords.map((training) => training.id),

    deletedTrainingIds,
  });

  return transaction.trainingRecords;
}

export async function unlinkTrainingCertification(trainingId, certificationId, rowVersion) {
  return unlinkTrainingCertificationApi(trainingId, certificationId, rowVersion);
}

export async function linkTrainingCertification(trainingId, certificationId, rowVersion) {
  return linkTrainingCertificationApi(trainingId, certificationId, rowVersion);
}
