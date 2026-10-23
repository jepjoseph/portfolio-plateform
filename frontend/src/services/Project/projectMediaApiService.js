import {
  apiGet,
  apiPost,
  apiDelete,
} from "../apiClient.js";

import {
  fetchProjectBinary,
  createProjectBinaryObjectUrl,
} from "./projectBinaryApi.js";

function mediaBasePath(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new TypeError("A Project ID is required.");
  }

  return `/projects/${encodeURIComponent(projectId.trim())}/media`;
}

function mediaPath(projectId, mediaId) {
  if (typeof mediaId !== "string" || !mediaId.trim()) {
    throw new TypeError("A media ID is required.");
  }

  return `${mediaBasePath(projectId)}/${encodeURIComponent(mediaId.trim())}`;
}

export async function fetchProjectMedia(projectId, options = {}) {
  return apiGet(mediaBasePath(projectId), options);
}

export async function uploadProjectMedia(projectId, file, options = {}) {
  if (!(file instanceof Blob)) {
    throw new TypeError("A media File or Blob is required.");
  }

  const formData = new FormData();
  formData.append("media", file, file.name || "media");

  return apiPost(mediaBasePath(projectId), formData, {
    timeoutMs: 180000,
    ...options,
  });
}

export async function fetchProjectMediaBlob(
  projectId,
  mediaId,
  options = {},
) {
  return fetchProjectBinary(mediaPath(projectId, mediaId), options);
}

export async function createProjectMediaObjectUrl(
  projectId,
  mediaId,
  options = {},
) {
  return createProjectBinaryObjectUrl(
    mediaPath(projectId, mediaId),
    options,
  );
}

export async function deleteProjectMedia(
  projectId,
  mediaId,
  options = {},
) {
  return apiDelete(mediaPath(projectId, mediaId), options);
}