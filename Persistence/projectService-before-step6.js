import {
  listProjectsByUser,
  findProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../../repositories/projectRepository.js";

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

function assertRowVersion(rowVersion) {
  if (
    typeof rowVersion !== "string" ||
    !/^[A-Za-z0-9+/]{11}=$/.test(rowVersion)
  ) {
    throw createProjectError({
      message: "A valid Project row version is required.",
      code: "PROJECT_VERSION_REQUIRED",
      status: 400,
      publicMessage: "Reload the Project before saving your changes.",
    });
  }

  return rowVersion;
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

  if (!project || typeof project !== "object") {
    throw createProjectError({
      message: "Project input must be an object.",
      code: "PROJECT_INPUT_INVALID",
      status: 400,
      publicMessage: "The Project information is invalid.",
    });
  }

  const projectId = assertProjectId(project.id);

  try {
    return await createProject(authenticatedUserId, {
      ...project,
      id: projectId,
    });
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
  const expectedRowVersion = assertRowVersion(rowVersion);

  const existingProject = await findProjectById(
    authenticatedUserId,
    normalizedProjectId,
  );

  if (!existingProject) {
    throw projectNotFound();
  }

  const updatedProject = await updateProject(
    authenticatedUserId,
    {
      ...project,
      id: normalizedProjectId,
    },
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
  const existingProject = await getAuthenticatedProject({
    userId,
    projectId,
  });

  return updateAuthenticatedProject({
    userId,
    projectId,
    rowVersion,
    project: {
      ...existingProject,
      recordStatus: archived ? "archived" : "active",
    },
  });
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
