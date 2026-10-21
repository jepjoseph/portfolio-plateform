
import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "../apiClient.js";

import { prepareProjectApiPayload } from "./projectApiAdapter.js";

const PROJECT_ENDPOINT = "/projects";

function projectPath(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new TypeError("A Project ID is required.");
  }

  return `${PROJECT_ENDPOINT}/${encodeURIComponent(projectId.trim())}`;
}

function requireRowVersion(rowVersion) {
  if (typeof rowVersion !== "string" || !rowVersion.trim()) {
    throw new TypeError("A Project rowVersion is required.");
  }

  return rowVersion.trim();
}

export async function fetchProjects(options = {}) {
  const response = await apiGet(PROJECT_ENDPOINT, options);
  return response.data.projects;
}

export async function fetchProjectById(projectId, options = {}) {
  const response = await apiGet(projectPath(projectId), options);
  return response.data.project;
}

export async function createProjectApi(project, options = {}) {
  const response = await apiPost(PROJECT_ENDPOINT, prepareProjectApiPayload(project), options);
  return response.data.project;
}

export async function updateProjectApi(
  projectId,
  project,
  rowVersion,
  options = {},
) {
  const response = await apiPut(
    projectPath(projectId),
    {
      project: prepareProjectApiPayload(project),
      rowVersion: requireRowVersion(rowVersion),
    },
    options,
  );

  return response.data.project;
}

export async function setProjectArchivedApi(
  projectId,
  archived,
  rowVersion,
  options = {},
) {
  if (typeof archived !== "boolean") {
    throw new TypeError("archived must be a boolean.");
  }

  const response = await apiPatch(
    `${projectPath(projectId)}/archive`,
    {
      archived,
      rowVersion: requireRowVersion(rowVersion),
    },
    options,
  );

  return response.data.project;
}

export async function deleteProjectApi(
  projectId,
  rowVersion,
  options = {},
) {
  const response = await apiDelete(projectPath(projectId), {
    ...options,
    body: {
      rowVersion: requireRowVersion(rowVersion),
    },
  });

  return response.data;
}

