import assert from "node:assert/strict";
import { after, before, beforeEach, mock, test } from "node:test";

const serviceModuleUrl = new URL(
  "../../src/services/Service/projectService.js",
  import.meta.url,
);

const middlewareModuleUrl = new URL(
  "../../src/middleware/project/projectOwnershipMiddleware.js",
  import.meta.url,
);

const projectService = await import(serviceModuleUrl.href);

const getProjectMock = mock.method(
  projectService,
  "getAuthenticatedProject",
  async () => null,
);

const { requireProjectOwnership } = await import(middlewareModuleUrl.href);

beforeEach(() => {
  getProjectMock.mock.resetCalls();
});

after(() => {
  mock.restoreAll();
});

function createRequest({
  userId = "user-123",
  projectId = "project-456",
} = {}) {
  return {
    auth: userId === null ? undefined : { userId },
    params: { projectId },
  };
}

async function executeMiddleware(request) {
  const calls = [];

  await requireProjectOwnership(request, {}, (error) => {
    calls.push(error);
  });

  assert.equal(calls.length, 1);

  return calls[0];
}

test("authorizes a Project owned by the authenticated user", async () => {
  const project = {
    id: "project-456",
    title: "My Project",
  };

  getProjectMock.mock.mockImplementation(async () => project);

  const request = createRequest();
  const error = await executeMiddleware(request);

  assert.equal(error, undefined);
  assert.equal(request.authorizedProject, project);
  assert.equal(getProjectMock.mock.callCount(), 1);

  assert.deepEqual(getProjectMock.mock.calls[0].arguments[0], {
    userId: "user-123",
    projectId: "project-456",
  });
});

test("forwards a Project not found error", async () => {
  const notFoundError = Object.assign(new Error("Project not found."), {
    code: "PROJECT_NOT_FOUND",
    status: 404,
  });

  getProjectMock.mock.mockImplementation(async () => {
    throw notFoundError;
  });

  const request = createRequest();
  const error = await executeMiddleware(request);

  assert.equal(error, notFoundError);
  assert.equal(request.authorizedProject, undefined);
});

test("does not authorize a Project owned by another user", async () => {
  const ownershipError = Object.assign(
    new Error("Project not found for authenticated user."),
    {
      code: "PROJECT_NOT_FOUND",
      status: 404,
    },
  );

  getProjectMock.mock.mockImplementation(async () => {
    throw ownershipError;
  });

  const request = createRequest({
    userId: "another-user",
  });

  const error = await executeMiddleware(request);

  assert.equal(error, ownershipError);
  assert.equal(request.authorizedProject, undefined);

  assert.deepEqual(getProjectMock.mock.calls[0].arguments[0], {
    userId: "another-user",
    projectId: "project-456",
  });
});

test("forwards database errors without authorizing the Project", async () => {
  const databaseError = new Error("Database unavailable.");

  getProjectMock.mock.mockImplementation(async () => {
    throw databaseError;
  });

  const request = createRequest();
  const error = await executeMiddleware(request);

  assert.equal(error, databaseError);
  assert.equal(request.authorizedProject, undefined);
});

test("passes missing authentication information to the Project service", async () => {
  const authenticationError = Object.assign(
    new Error("An authenticated user ID is required."),
    {
      code: "PROJECT_AUTHENTICATION_REQUIRED",
      status: 401,
    },
  );

  getProjectMock.mock.mockImplementation(async () => {
    throw authenticationError;
  });

  const request = createRequest({
    userId: null,
  });

  const error = await executeMiddleware(request);

  assert.equal(error, authenticationError);
  assert.equal(request.authorizedProject, undefined);

  assert.deepEqual(getProjectMock.mock.calls[0].arguments[0], {
    userId: undefined,
    projectId: "project-456",
  });
});
