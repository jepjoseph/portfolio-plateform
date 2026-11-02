import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchSkills,
  fetchSkillById,
  createSkillApi,
  updateSkillApi,
  setSkillArchivedApi,
  archiveSkillApi,
  restoreSkillApi,
  deleteSkillApi,
} from "../../src/services/Skill/skillApiService.js";

import { ApiError } from "../../src/services/apiClient.js";

const ROW_VERSION = "AAAAAAAAAAE=";

const SKILL = {
  id: "skill-test-123",
  name: "JavaScript",
  category: "technical",
  status: "active",
  rowVersion: ROW_VERSION,
};

function mockResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

async function withMockFetch(handler, callback) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    const request = {
      url: String(url),
      method: options.method,
      credentials: options.credentials,
      headers: options.headers,
      body: options.body,
    };

    requests.push(request);

    return handler(request);
  };

  try {
    await callback(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function assertEndpoint(request, method, path) {
  assert.equal(request.method, method);
  assert.equal(new URL(request.url).pathname, `/api${path}`);
  assert.equal(request.credentials, "include");
}

function parseBody(request) {
  return JSON.parse(request.body);
}

test("GET retrieves the Skills collection", async () => {
  await withMockFetch(
    () => mockResponse({
      data: {
        skills: [SKILL],
      },
    }),
    async (requests) => {
      const result = await fetchSkills();

      assert.deepEqual(result, [SKILL]);
      assert.equal(result[0].rowVersion, ROW_VERSION);
      assert.equal(requests.length, 1);

      assertEndpoint(requests[0], "GET", "/skills");
    },
  );
});

test("GET retrieves one Skill by ID", async () => {
  await withMockFetch(
    () => mockResponse({
      data: {
        skill: SKILL,
      },
    }),
    async (requests) => {
      const result = await fetchSkillById(SKILL.id);

      assert.deepEqual(result, SKILL);

      assertEndpoint(
        requests[0],
        "GET",
        `/skills/${SKILL.id}`,
      );
    },
  );
});

test("POST creates a Skill", async () => {
  const draft = {
    name: "JavaScript",
    category: "technical",
  };

  await withMockFetch(
    () => mockResponse({
      data: {
        skill: SKILL,
      },
    }, 201),
    async (requests) => {
      const result = await createSkillApi(draft);

      assert.deepEqual(result, SKILL);

      assertEndpoint(requests[0], "POST", "/skills");

      assert.deepEqual(parseBody(requests[0]), draft);
    },
  );
});

test("PATCH updates a Skill with rowVersion", async () => {
  const updates = {
    description: "Updated description",
  };

  await withMockFetch(
    () => mockResponse({
      data: {
        skill: {
          ...SKILL,
          ...updates,
        },
      },
    }),
    async (requests) => {
      const result = await updateSkillApi(
        SKILL.id,
        updates,
        ROW_VERSION,
      );

      assert.equal(result.description, updates.description);
      assert.equal(result.rowVersion, ROW_VERSION);

      assertEndpoint(
        requests[0],
        "PATCH",
        `/skills/${SKILL.id}`,
      );

      assert.deepEqual(parseBody(requests[0]), {
        updates,
        rowVersion: ROW_VERSION,
      });
    },
  );
});

test("PATCH archives a Skill", async () => {
  await withMockFetch(
    () => mockResponse({
      data: {
        skill: {
          ...SKILL,
          status: "archived",
        },
      },
    }),
    async (requests) => {
      const result = await archiveSkillApi(
        SKILL.id,
        ROW_VERSION,
      );

      assert.equal(result.status, "archived");

      assertEndpoint(
        requests[0],
        "PATCH",
        `/skills/${SKILL.id}/archive`,
      );

      assert.deepEqual(parseBody(requests[0]), {
        archived: true,
        rowVersion: ROW_VERSION,
      });
    },
  );
});

test("PATCH restores an archived Skill", async () => {
  await withMockFetch(
    () => mockResponse({
      data: {
        skill: SKILL,
      },
    }),
    async (requests) => {
      const result = await restoreSkillApi(
        SKILL.id,
        ROW_VERSION,
      );

      assert.equal(result.status, "active");

      assert.deepEqual(parseBody(requests[0]), {
        archived: false,
        rowVersion: ROW_VERSION,
      });
    },
  );
});

test("setSkillArchivedApi rejects invalid archived values", async () => {
  await withMockFetch(
    () => {
      throw new Error("Request should not be sent.");
    },
    async (requests) => {
      await assert.rejects(
        setSkillArchivedApi(
          SKILL.id,
          "true",
          ROW_VERSION,
        ),
        TypeError,
      );

      assert.equal(requests.length, 0);
    },
  );
});

test("DELETE sends rowVersion in the request body", async () => {
  await withMockFetch(
    () => mockResponse({
      data: {
        deleted: true,
      },
    }),
    async (requests) => {
      const result = await deleteSkillApi(
        SKILL.id,
        ROW_VERSION,
      );

      assert.deepEqual(result, {
        deleted: true,
      });

      assertEndpoint(
        requests[0],
        "DELETE",
        `/skills/${SKILL.id}`,
      );

      assert.deepEqual(parseBody(requests[0]), {
        rowVersion: ROW_VERSION,
      });
    },
  );
});

test("rejects invalid Skill IDs", async () => {
  await assert.rejects(
    fetchSkillById(""),
    TypeError,
  );

  await assert.rejects(
    fetchSkillById(null),
    TypeError,
  );

  await assert.rejects(
    fetchSkillById("x".repeat(201)),
    TypeError,
  );
});

test("rejects missing rowVersion before sending requests", async () => {
  await withMockFetch(
    () => {
      throw new Error("Request should not be sent.");
    },
    async (requests) => {
      await assert.rejects(
        updateSkillApi(
          SKILL.id,
          { name: "Updated" },
          "",
        ),
        TypeError,
      );

      await assert.rejects(
        archiveSkillApi(SKILL.id, null),
        TypeError,
      );

      await assert.rejects(
        deleteSkillApi(SKILL.id, undefined),
        TypeError,
      );

      assert.equal(requests.length, 0);
    },
  );
});

test("rejects invalid create and update payloads", async () => {
  await withMockFetch(
    () => {
      throw new Error("Request should not be sent.");
    },
    async (requests) => {
      await assert.rejects(
        createSkillApi(null),
        TypeError,
      );

      await assert.rejects(
        createSkillApi([]),
        TypeError,
      );

      await assert.rejects(
        updateSkillApi(
          SKILL.id,
          [],
          ROW_VERSION,
        ),
        TypeError,
      );

      assert.equal(requests.length, 0);
    },
  );
});

test("preserves backend concurrency conflicts", async () => {
  await withMockFetch(
    () => mockResponse({
      code: "SKILL_VERSION_CONFLICT",
      message: "Skill was modified by another session.",
    }, 409),
    async () => {
      await assert.rejects(
        updateSkillApi(
          SKILL.id,
          { name: "Updated" },
          ROW_VERSION,
        ),
        (error) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 409);
          assert.equal(error.code, "SKILL_VERSION_CONFLICT");
          return true;
        },
      );
    },
  );
});

test("preserves authentication errors", async () => {
  await withMockFetch(
    () => mockResponse({
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication required.",
    }, 401),
    async () => {
      await assert.rejects(
        fetchSkills(),
        (error) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 401);
          assert.equal(error.code, "AUTHENTICATION_REQUIRED");
          return true;
        },
      );
    },
  );
});

test("preserves backend validation errors", async () => {
  await withMockFetch(
    () => mockResponse({
      code: "SKILL_VALIDATION_FAILED",
      message: "Skill validation failed.",
      fieldErrors: {
        name: "Name is required.",
      },
    }, 400),
    async () => {
      await assert.rejects(
        createSkillApi({ name: "" }),
        (error) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 400);
          assert.equal(error.code, "SKILL_VALIDATION_FAILED");
          assert.equal(
            error.fieldErrors.name,
            "Name is required.",
          );
          return true;
        },
      );
    },
  );
});