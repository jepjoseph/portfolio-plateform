import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchProjects,
  fetchProjectById,
  createProjectApi,
  updateProjectApi,
  setProjectArchivedApi,
  deleteProjectApi,
} from "../../src/services/Project/projectApiService.js";

const ROW_VERSION = "AAAAAAAAAAE=";

const project = {
  id: "project-test",
  title: "Test Project",
  createdAt: "2026-10-20",
  updatedAt: "2026-10-20",
  rowVersion: ROW_VERSION,
  presentation: {
    isFeatured: false,
  },
};

function createApiResponse(data, status = 200) {
  return new Response(
    JSON.stringify({
      status: "success",
      message: "OK",
      data,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

async function withMockFetch(callback, responseData, status = 200) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    return createApiResponse(responseData, status);
  };

  try {
    await callback(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("fetchProjects sends GET and returns Projects", async () => {
  await withMockFetch(
    async (requests) => {
      const result = await fetchProjects();

      assert.deepEqual(result, [project]);
      assert.equal(requests.length, 1);
      assert.match(requests[0].url, /\/api\/projects$/);
      assert.equal(requests[0].options.method, "GET");
    },
    { projects: [project] },
  );
});

test("fetchProjectById sends GET for one Project", async () => {
  await withMockFetch(
    async (requests) => {
      const result = await fetchProjectById(project.id);

      assert.deepEqual(result, project);
      assert.match(requests[0].url, /\/api\/projects\/project-test$/);
      assert.equal(requests[0].options.method, "GET");
    },
    { project },
  );
});

test("createProjectApi removes server-owned fields", async () => {
  await withMockFetch(
    async (requests) => {
      const result = await createProjectApi(project);

      assert.deepEqual(result, project);
      assert.equal(requests[0].options.method, "POST");

      const body = JSON.parse(requests[0].options.body);

      assert.equal(body.title, project.title);
      assert.equal(Object.hasOwn(body, "createdAt"), false);
      assert.equal(Object.hasOwn(body, "updatedAt"), false);
      assert.equal(Object.hasOwn(body, "rowVersion"), false);

      assert.equal(project.createdAt, "2026-10-20");
    },
    { project },
    201,
  );
});

test("updateProjectApi sends Project and rowVersion separately", async () => {
  await withMockFetch(
    async (requests) => {
      const result = await updateProjectApi(
        project.id,
        project,
        ROW_VERSION,
      );

      assert.deepEqual(result, project);
      assert.equal(requests[0].options.method, "PUT");

      const body = JSON.parse(requests[0].options.body);

      assert.equal(body.rowVersion, ROW_VERSION);
      assert.equal(body.project.title, project.title);
      assert.equal(Object.hasOwn(body.project, "createdAt"), false);
      assert.equal(Object.hasOwn(body.project, "rowVersion"), false);
    },
    { project },
  );
});

test("setProjectArchivedApi sends PATCH with rowVersion", async () => {
  await withMockFetch(
    async (requests) => {
      await setProjectArchivedApi(
        project.id,
        true,
        ROW_VERSION,
      );

      assert.equal(requests[0].options.method, "PATCH");
      assert.match(requests[0].url, /\/archive$/);

      const body = JSON.parse(requests[0].options.body);

      assert.deepEqual(body, {
        archived: true,
        rowVersion: ROW_VERSION,
      });
    },
    { project },
  );
});

test("deleteProjectApi sends DELETE with rowVersion", async () => {
  await withMockFetch(
    async (requests) => {
      const result = await deleteProjectApi(
        project.id,
        ROW_VERSION,
      );

      assert.equal(requests[0].options.method, "DELETE");

      const body = JSON.parse(requests[0].options.body);

      assert.deepEqual(body, {
        rowVersion: ROW_VERSION,
      });

      assert.deepEqual(result, {
        deleted: true,
      });
    },
    { deleted: true },
  );
});
