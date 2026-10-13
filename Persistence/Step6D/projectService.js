import {
  listProjectsByUser,
  findProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../../repositories/projectRepository.js";

import {
  parseProjectInput,
  parseProjectRowVersion,
} from "../../schemas/projectSchemas.js";

const SERVER_OWNED_FIELDS = [
  "userId",
  "user_id",
  "createdAt",
  "updatedAt",
  "rowVersion",
];

function createProjectError({ message, code, status, publicMessage }) {
  const error = new Error(message);
  error.name = "ProjectServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  return error;
}

function assertUserId(userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw createProjectError({
      message: "An authenticated user ID is required.",
      code: "PROJECT_AUTHENTICATION_REQUIRED",
      status: 401,
      publicMessage: "You must sign in to access your Projects.",
    });
  }

  return userId.trim();
}

function assertProjectId(projectId) {
  if (
    typeof projectId !== "string" ||
    !projectId.trim() ||
    projectId.length > 200
  ) {
    throw createProjectError({
      message: "A valid Project ID is required.",
      code: "PROJECT_ID_INVALID",
      status: 400,
      publicMessage: "The Project identifier is invalid.",
    });
  }

  return projectId.trim();
}

function projectNotFound() {
  return createProjectError({
    message: "Project not found for authenticated user.",
    code: "PROJECT_NOT_FOUND",
    status: 404,
    publicMessage: "The requested Project could not be found.",
  });
}

function projectVersionConflict() {
  return createProjectError({
    message: "Project version conflict.",
    code: "PROJECT_VERSION_CONFLICT",
    status: 409,
    publicMessage:
      "This Project was changed elsewhere. Reload it before saving.",
  });
}

function projectIdMismatch() {
  return createProjectError({
    message: "The Project body ID does not match the requested Project ID.",
    code: "PROJECT_ID_MISMATCH",
    status: 400,
    publicMessage: "The Project identifiers do not match.",
  });
}

function withoutServerFields(project) {
  const result = { ...project };

  for (const field of SERVER_OWNED_FIELDS) {
    delete result[field];
  }

  return result;
}

export async function getAuthenticatedProjects({ userId }) {
  return listProjectsByUser(assertUserId(userId));
}

export async function getAuthenticatedProject({ userId, projectId }) {
  const project = await findProjectById(
    assertUserId(userId),
    assertProjectId(projectId),
  );

  if (!project) {
    throw projectNotFound();
  }

  return project;
}

export async function createAuthenticatedProject({ userId, project }) {
  const authenticatedUserId = assertUserId(userId);

  // Reject invalid data before any database operation.
  // Client-supplied server-owned fields remain forbidden.
  const validatedProject = parseProjectInput(project);

  try {
    return await createProject(authenticatedUserId, validatedProject);
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      throw createProjectError({
        message: "Project ID already exists.",
        code: "PROJECT_ALREADY_EXISTS",
        status: 409,
        publicMessage: "A Project with this identifier already exists.",
      });
    }

    throw error;
  }
}

export async function updateAuthenticatedProject({
  userId,
  projectId,
  project,
  rowVersion,
}) {
  const authenticatedUserId = assertUserId(userId);
  const normalizedProjectId = assertProjectId(projectId);

  // Validate the supplied version and full Project body.
  const expectedRowVersion = parseProjectRowVersion(rowVersion);
  const validatedProject = parseProjectInput(project);

  if (validatedProject.id !== normalizedProjectId) {
    throw projectIdMismatch();
  }

  const existingProject = await findProjectById(
    authenticatedUserId,
    normalizedProjectId,
  );

  if (!existingProject) {
    throw projectNotFound();
  }

  const updatedProject = await updateProject(
    authenticatedUserId,
    validatedProject,
    expectedRowVersion,
  );

  if (!updatedProject) {
    throw projectVersionConflict();
  }

  return updatedProject;
}

export async function setAuthenticatedProjectArchiveStatus({
  userId,
  projectId,
  rowVersion,
  archived,
}) {
  const authenticatedUserId = assertUserId(userId);
  const normalizedProjectId = assertProjectId(projectId);
  const expectedRowVersion = parseProjectRowVersion(rowVersion);

  if (typeof archived !== "boolean") {
    throw createProjectError({
      message: "Archive status must be a boolean.",
      code: "PROJECT_ARCHIVE_STATUS_INVALID",
      status: 400,
      publicMessage: "A valid archive status is required.",
    });
  }

  const existingProject = await findProjectById(
    authenticatedUserId,
    normalizedProjectId,
  );

  if (!existingProject) {
    throw projectNotFound();
  }

  // Database-managed metadata is not editable Project content.
  const editableProject = withoutServerFields(existingProject);

  const validatedProject = parseProjectInput({
    ...editableProject,
    recordStatus: archived ? "archived" : "active",
  });

  // SQL Server must match the caller's row version.
  // Do not substitute the version from the latest database read.
  const updatedProject = await updateProject(
    authenticatedUserId,
    validatedProject,
    expectedRowVersion,
  );

  if (!updatedProject) {
    throw projectVersionConflict();
  }

  return updatedProject;
}

export async function deleteAuthenticatedProject({ userId, projectId }) {
  const deleted = await deleteProject(
    assertUserId(userId),
    assertProjectId(projectId),
  );

  if (!deleted) {
    throw projectNotFound();
  }

  return { deleted: true };
}
