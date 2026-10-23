import {
  apiGet,
  apiPost,
  apiDelete,
} from "../apiClient.js";

import {
  fetchProjectBinary,
  createProjectBinaryObjectUrl,
} from "./projectBinaryApi.js";

function documentBasePath(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new TypeError("A Project ID is required.");
  }

  return `/projects/${encodeURIComponent(projectId.trim())}/documents`;
}

function documentPath(projectId, documentId) {
  if (typeof documentId !== "string" || !documentId.trim()) {
    throw new TypeError("A document ID is required.");
  }

  return `${documentBasePath(projectId)}/${encodeURIComponent(documentId.trim())}`;
}

export async function fetchProjectDocuments(projectId, options = {}) {
  return apiGet(documentBasePath(projectId), options);
}

export async function uploadProjectDocument(projectId, file, options = {}) {
  if (!(file instanceof Blob)) {
    throw new TypeError("A document File or Blob is required.");
  }

  const formData = new FormData();
  formData.append("document", file, file.name || "document");

  return apiPost(documentBasePath(projectId), formData, {
    timeoutMs: 180000,
    ...options,
  });
}

export async function fetchProjectDocumentBlob(
  projectId,
  documentId,
  options = {},
) {
  return fetchProjectBinary(
    documentPath(projectId, documentId),
    options,
  );
}

export async function createProjectDocumentObjectUrl(
  projectId,
  documentId,
  options = {},
) {
  return createProjectBinaryObjectUrl(
    documentPath(projectId, documentId),
    options,
  );
}

export async function deleteProjectDocument(
  projectId,
  documentId,
  options = {},
) {
  return apiDelete(documentPath(projectId, documentId), options);
}