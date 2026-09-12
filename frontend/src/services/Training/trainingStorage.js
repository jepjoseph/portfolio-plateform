import {
  normalizeTrainingCollection,
  TRAINING_MODEL_VERSION,
} from "../../models/trainingModel.js";

export const TRAINING_STORAGE_KEY = "portfolio-platform:training";

const TRAINING_STORAGE_VERSION = 1;

function createTrainingStorageError(message, publicMessage, cause = null) {
  const error = new Error(message);

  error.name = "TrainingStorageError";
  error.code = "TRAINING_STORAGE_ERROR";
  error.publicMessage = publicMessage;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

function getBrowserStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw createTrainingStorageError(
      "Training storage is unavailable.",
      "Training storage is not supported in this environment.",
    );
  }

  return window.localStorage;
}

function createEmptyTrainingStorageDocument() {
  return {
    storageVersion: TRAINING_STORAGE_VERSION,
    trainingModelVersion: TRAINING_MODEL_VERSION,
    trainingRecords: [],
    updatedAt: new Date().toISOString(),
  };
}

function parseTrainingStorageDocument(value) {
  if (!value) {
    return createEmptyTrainingStorageDocument();
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(value);
  } catch (cause) {
    throw createTrainingStorageError(
      "Unable to parse stored training data.",
      "The saved Training Library could not be read.",
      cause,
    );
  }

  if (Array.isArray(parsedValue)) {
    return {
      ...createEmptyTrainingStorageDocument(),
      trainingRecords: normalizeTrainingCollection(parsedValue),
    };
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    throw createTrainingStorageError(
      "Stored training data has an invalid structure.",
      "The saved Training Library has an invalid format.",
    );
  }

  return {
    storageVersion:
      Number(parsedValue.storageVersion) || TRAINING_STORAGE_VERSION,

    trainingModelVersion:
      Number(parsedValue.trainingModelVersion) || TRAINING_MODEL_VERSION,

    trainingRecords: normalizeTrainingCollection(
      parsedValue.trainingRecords ||
        parsedValue.training ||
        parsedValue.records,
    ),

    updatedAt:
      typeof parsedValue.updatedAt === "string"
        ? parsedValue.updatedAt
        : new Date().toISOString(),
  };
}

export function readTrainingStorage() {
  const storage = getBrowserStorage();

  try {
    return parseTrainingStorageDocument(storage.getItem(TRAINING_STORAGE_KEY));
  } catch (error) {
    if (error?.name === "TrainingStorageError") {
      throw error;
    }

    throw createTrainingStorageError(
      "Unable to read Training Library storage.",
      "Your saved training records could not be loaded.",
      error,
    );
  }
}

export function writeTrainingStorage(trainingRecords) {
  const storage = getBrowserStorage();

  const document = {
    storageVersion: TRAINING_STORAGE_VERSION,
    trainingModelVersion: TRAINING_MODEL_VERSION,
    trainingRecords: normalizeTrainingCollection(trainingRecords),
    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(document));

    return document;
  } catch (error) {
    throw createTrainingStorageError(
      "Unable to write Training Library storage.",
      "Your training records could not be saved.",
      error,
    );
  }
}

export function readStoredTraining() {
  return readTrainingStorage().trainingRecords;
}

export function replaceStoredTraining(trainingRecords) {
  return writeTrainingStorage(trainingRecords).trainingRecords;
}

export function updateStoredTraining(updater) {
  if (typeof updater !== "function") {
    throw createTrainingStorageError(
      "The training updater must be a function.",
      "The Training Library could not be updated.",
    );
  }

  const nextRecords = updater([...readStoredTraining()]);

  if (!Array.isArray(nextRecords)) {
    throw createTrainingStorageError(
      "The training updater did not return an array.",
      "The Training Library could not be updated.",
    );
  }

  return replaceStoredTraining(nextRecords);
}

export function clearTrainingStorage() {
  try {
    getBrowserStorage().removeItem(TRAINING_STORAGE_KEY);
  } catch (error) {
    throw createTrainingStorageError(
      "Unable to clear Training Library storage.",
      "The saved Training Library could not be cleared.",
      error,
    );
  }
}

export function getTrainingStorageInformation() {
  const document = readTrainingStorage();

  return {
    storageKey: TRAINING_STORAGE_KEY,
    storageVersion: document.storageVersion,
    trainingModelVersion: document.trainingModelVersion,
    trainingCount: document.trainingRecords.length,
    updatedAt: document.updatedAt,
  };
}
