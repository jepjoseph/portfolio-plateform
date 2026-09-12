import {
  createEmptyTraining,
  createTraining as createTrainingModel,
  normalizeTraining,
  normalizeTrainingCollection,
  updateTrainingModel,
} from "../../models/trainingModel.js";

import { deleteStoredDocuments } from "../Documents/documentStorage.js";

import { assertValidTraining, validateTraining } from "./trainingValidation.js";

import {
  readStoredTraining,
  replaceStoredTraining,
} from "./trainingStorage.js";

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
  const records = readStoredTraining();

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

  const training = readStoredTraining().find(
    (record) => record.id === trainingId,
  );

  if (!training) {
    throw createTrainingNotFoundError(trainingId);
  }

  return training;
}

export async function createTraining(trainingData) {
  const records = readStoredTraining();

  const candidate = createTrainingCandidate(trainingData);

  assertValidTraining(candidate);

  const training = createTrainingModel(candidate);

  if (records.some((record) => record.id === training.id)) {
    throw createTrainingServiceError({
      message: `Training ID "${training.id}" already exists.`,
      publicMessage:
        "This training record could not be created because its identifier already exists.",
      code: "TRAINING_ID_CONFLICT",
      status: 409,
    });
  }

  replaceStoredTraining([training, ...records]);

  return training;
}

export async function updateTraining(trainingId, updates = {}) {
  if (!trainingId) {
    throw createTrainingServiceError({
      message: "A training ID is required.",
      publicMessage: "The training record could not be identified.",
      code: "TRAINING_ID_REQUIRED",
      status: 400,
    });
  }

  const records = readStoredTraining();

  const recordIndex = records.findIndex(
    (training) => training.id === trainingId,
  );

  if (recordIndex === -1) {
    throw createTrainingNotFoundError(trainingId);
  }

  const currentTraining = records[recordIndex];

  const candidate = createTrainingCandidate({
    ...currentTraining,
    ...updates,

    provider: {
      ...currentTraining.provider,
      ...updates.provider,
    },

    delivery: {
      ...currentTraining.delivery,
      ...updates.delivery,

      location: {
        ...currentTraining.delivery?.location,
        ...updates.delivery?.location,
      },
    },

    dates: {
      ...currentTraining.dates,
      ...updates.dates,
    },

    completion: {
      ...currentTraining.completion,
      ...updates.completion,
    },

    visibility: {
      ...currentTraining.visibility,
      ...updates.visibility,
    },

    privateInformation: {
      ...currentTraining.privateInformation,
      ...updates.privateInformation,
    },
  });

  assertValidTraining(candidate);

  const updatedTraining = updateTrainingModel(currentTraining, updates);

  const nextRecords = [...records];

  nextRecords[recordIndex] = updatedTraining;

  replaceStoredTraining(nextRecords);

  return updatedTraining;
}

export async function archiveTraining(trainingId) {
  return updateTraining(trainingId, {
    status: "archived",
  });
}

export async function restoreTraining(trainingId) {
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

  let documentCleanup;

  try {
    documentCleanup = await deleteStoredDocuments(storageKeys);
  } catch (cleanupError) {
    throw createTrainingServiceError({
      message: `Training "${trainingId}" was preserved because document cleanup failed.`,

      publicMessage:
        cleanupError?.publicMessage ||
        "The training record was not deleted because its documents could not be removed.",

      code: "TRAINING_DOCUMENT_CLEANUP_FAILED",

      status: 500,

      details: {
        trainingId,
        trainingTitle: recordToDelete.title,
        recordPreserved: true,
        documents: cleanupError?.cleanup || null,
      },
    });
  }

  const remainingRecords = records.filter(
    (training) => training.id !== trainingId,
  );

  try {
    replaceStoredTraining(remainingRecords);
  } catch (storageError) {
    throw createTrainingServiceError({
      message: `Documents for Training "${trainingId}" were deleted, but its metadata could not be removed.`,

      publicMessage:
        "The documents were removed, but the training record could not be fully deleted. Try again.",

      code: "TRAINING_DELETE_PARTIAL",

      status: 500,

      details: {
        trainingId,
        trainingTitle: recordToDelete.title,
        documents: documentCleanup,
        originalError: storageError,
      },
    });
  }

  return {
    id: trainingId,
    title: recordToDelete.title,
    providerName: recordToDelete.provider?.name || "",
    deleted: true,
    documents: documentCleanup,
  };
}

export async function validateTrainingDraft(trainingData) {
  return validateTraining(createTrainingCandidate(trainingData));
}

export async function replaceTrainingRecords(trainingValues) {
  if (!Array.isArray(trainingValues)) {
    throw createTrainingServiceError({
      message: "The replacement Training Library must be an array.",
      publicMessage: "The Training Library has an invalid format.",
      code: "INVALID_TRAINING_COLLECTION",
      status: 400,
    });
  }

  const validatedRecords = trainingValues.map((value) => {
    const candidate = createTrainingCandidate(value);

    assertValidTraining(candidate);

    return normalizeTraining(candidate);
  });

  return replaceStoredTraining(normalizeTrainingCollection(validatedRecords));
}
