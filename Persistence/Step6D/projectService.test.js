import test, { mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

const projectId = "project-550e8400-e29b-41d4-a716-446655440000";
const userId = "550e8400-e29b-41d4-a716-446655440001";
const version = Buffer.alloc(8, 1).toString("base64");

const calls = [];
let storedProject = null;
let updateResult = undefined;

function validProject() {
  return {
    id: projectId,
    title: "SmartSwitch Configurator",
    role: "Full-stack Developer",
    category: "web-application",
    lifecycleStatus: "in-progress",
    recordStatus: "active",
    dates: {
      startDate: "2026-10-01",
      endDate: "",
      isCurrent: true,
    },
    presentation: { isFeatured: false },
  };
}

mock.module("../../src/repositories/projectRepository.js", {
  namedExports: {
    listProjectsByUser: async (owner) => {
      calls.push(["list", owner]);
      return storedProject ? [storedProject] : [];
    },

    findProjectById: async (owner, id) => {
      calls.push(["find", owner, id]);
      return storedProject;
    },

    createProject: async (owner, project) => {
      calls.push(["create", owner, project]);
      return project;
    },

    updateProject: async (owner, project, rowVersion) => {
      calls.push(["update", owner, project, rowVersion]);
      return updateResult === undefined ? project : updateResult;
    },

    deleteProject: async (owner, id) => {
      calls.push(["delete", owner, id]);
      return Boolean(storedProject);
    },
  },
});

const {
  createAuthenticatedProject,
  updateAuthenticatedProject,
  setAuthenticatedProjectArchiveStatus,
  deleteAuthenticatedProject,
} = await import("../../src/services/Service/projectService.js");

beforeEach(() => {
  calls.length = 0;
  storedProject = null;
  updateResult = undefined;
});

test("create validates before calling repository", async () => {
  const project = validProject();
  project.title = "";

  await assert.rejects(
    createAuthenticatedProject({ userId, project }),
    (error) => error.code === "PROJECT_VALIDATION_FAILED",
  );

  assert.equal(calls.length, 0);
});

test("create passes a validated Project and authenticated owner", async () => {
  const project = validProject();

  await createAuthenticatedProject({ userId, project });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "create");
  assert.equal(calls[0][1], userId);
  assert.equal(calls[0][2].id, projectId);
});

test("create rejects client-supplied timestamps", async () => {
  const project = validProject();
  project.createdAt = "2020-01-01T00:00:00.000Z";

  await assert.rejects(
    createAuthenticatedProject({ userId, project }),
    (error) => error.code === "PROJECT_VALIDATION_FAILED",
  );

  assert.equal(calls.length, 0);
});

test("update rejects mismatched body and URL IDs", async () => {
  const project = validProject();

  await assert.rejects(
    updateAuthenticatedProject({
      userId,
      projectId: "project-other",
      project,
      rowVersion: version,
    }),
    (error) => error.code === "PROJECT_ID_MISMATCH",
  );

  assert.equal(calls.length, 0);
});

test("update preserves the caller's row version", async () => {
  storedProject = {
    ...validProject(),
    rowVersion: Buffer.alloc(8, 2).toString("base64"),
  };

  await updateAuthenticatedProject({
    userId,
    projectId,
    project: validProject(),
    rowVersion: version,
  });

  const updateCall = calls.find(([name]) => name === "update");

  assert.ok(updateCall);
  assert.equal(updateCall[1], userId);
  assert.equal(updateCall[3], version);
});

test("update returns a conflict when repository rejects stale version", async () => {
  storedProject = validProject();
  updateResult = null;

  await assert.rejects(
    updateAuthenticatedProject({
      userId,
      projectId,
      project: validProject(),
      rowVersion: version,
    }),
    (error) =>
      error.code === "PROJECT_VERSION_CONFLICT" &&
      error.status === 409,
  );
});

test("archive strips database-managed metadata", async () => {
  storedProject = {
    ...validProject(),
    createdAt: new Date(),
    updatedAt: new Date(),
    rowVersion: version,
    userId,
  };

  await setAuthenticatedProjectArchiveStatus({
    userId,
    projectId,
    rowVersion: version,
    archived: true,
  });

  const updateCall = calls.find(([name]) => name === "update");

  assert.ok(updateCall);

  const saved = updateCall[2];

  assert.equal(saved.recordStatus, "archived");
  assert.equal(Object.hasOwn(saved, "createdAt"), false);
  assert.equal(Object.hasOwn(saved, "updatedAt"), false);
  assert.equal(Object.hasOwn(saved, "rowVersion"), false);
  assert.equal(Object.hasOwn(saved, "userId"), false);
  assert.equal(updateCall[3], version);
});

test("archive rejects a non-boolean status", async () => {
  await assert.rejects(
    setAuthenticatedProjectArchiveStatus({
      userId,
      projectId,
      rowVersion: version,
      archived: "yes",
    }),
    (error) => error.code === "PROJECT_ARCHIVE_STATUS_INVALID",
  );

  assert.equal(calls.length, 0);
});

test("delete is scoped to authenticated user", async () => {
  storedProject = validProject();

  const result = await deleteAuthenticatedProject({ userId, projectId });

  assert.deepEqual(result, { deleted: true });
  assert.deepEqual(calls[0], ["delete", userId, projectId]);
});

test("delete returns not found when repository deletes nothing", async () => {
  await assert.rejects(
    deleteAuthenticatedProject({ userId, projectId }),
    (error) => error.code === "PROJECT_NOT_FOUND",
  );
});
