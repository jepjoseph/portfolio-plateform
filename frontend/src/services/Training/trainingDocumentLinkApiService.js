import { apiGet, apiPost, apiDelete } from "../apiClient.js";

function validId(value, label) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 200
  ) {
    throw new TypeError(`A valid ${label} is required.`);
  }

  return encodeURIComponent(value.trim());
}

function linksPath(trainingId) {
  return `/trainings/${validId(trainingId, "Training ID")}/document-links`;
}

export async function fetchTrainingDocumentLinks(trainingId, options = {}) {
  const response = await apiGet(linksPath(trainingId), options);

  if (!Array.isArray(response?.data?.links)) {
    throw new TypeError("Invalid Training document links API response.");
  }

  return response.data.links;
}

export async function createTrainingDocumentLinkApi(
  trainingId,
  certificationDocumentId,
  options = {},
) {
  const documentId = validId(
    certificationDocumentId,
    "Certification document ID",
  );

  const response = await apiPost(
    linksPath(trainingId),
    { certificationDocumentId: decodeURIComponent(documentId) },
    options,
  );

  if (
    !response?.data?.link ||
    typeof response.data.link !== "object" ||
    Array.isArray(response.data.link)
  ) {
    throw new TypeError("Invalid Training document link API response.");
  }

  return response.data.link;
}

export async function deleteTrainingDocumentLinkApi(
  trainingId,
  linkId,
  options = {},
) {
  const path = `${linksPath(trainingId)}/${validId(linkId, "Link ID")}`;

  await apiDelete(path, options);
}