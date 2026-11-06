import { apiGet, apiPost, apiPatch } from "../apiClient.js";

const TRAININGS_ENDPOINT = "/trainings";

function trainingPath(trainingId) {
  if (
    typeof trainingId !== "string" ||
    !trainingId.trim() ||
    trainingId.trim().length > 200
  ) {
    throw new TypeError("A valid Training ID is required.");
  }

  return `${TRAININGS_ENDPOINT}/${encodeURIComponent(
    trainingId.trim(),
  )}`;
}

export async function fetchTrainings(options = {}) {
  const response = await apiGet(TRAININGS_ENDPOINT, options);

  if (!Array.isArray(response?.data?.trainings)) {
    throw new TypeError("Invalid Training collection API response.");
  }

  return response.data.trainings;
}

export async function fetchTrainingById(trainingId, options = {}) {
  const response = await apiGet(trainingPath(trainingId), options);

  if (
    !response?.data?.training ||
    typeof response.data.training !== "object" ||
    Array.isArray(response.data.training)
  ) {
    throw new TypeError("Invalid Training record API response.");
  }

  return response.data.training;
}

export async function createTrainingApi(training, options = {}) {
  if (
    !training ||
    typeof training !== "object" ||
    Array.isArray(training)
  ) {
    throw new TypeError("A Training object is required.");
  }

  const response = await apiPost(
    TRAININGS_ENDPOINT,
    training,
    options,
  );

  if (
    !response?.data?.training ||
    typeof response.data.training !== "object" ||
    Array.isArray(response.data.training)
  ) {
    throw new TypeError("Invalid Training creation API response.");
  }

  return response.data.training;
}

export async function updateTrainingApi(
  trainingId,
  updates,
  rowVersion,
  options = {},
) {
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates) ||
    Object.keys(updates).length === 0
  ) {
    throw new TypeError("Training updates are required.");
  }

  if (typeof rowVersion !== "string" || !rowVersion.trim()) {
    throw new TypeError("A Training rowVersion is required.");
  }

  const response = await apiPatch(
    trainingPath(trainingId),
    {
      updates,
      rowVersion: rowVersion.trim(),
    },
    options,
  );

  if (
    !response?.data?.training ||
    typeof response.data.training !== "object" ||
    Array.isArray(response.data.training)
  ) {
    throw new TypeError("Invalid Training update API response.");
  }

  return response.data.training;
}
