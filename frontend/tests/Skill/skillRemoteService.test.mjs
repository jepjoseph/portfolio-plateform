import test from "node:test";
import assert from "node:assert/strict";

import {
  updateSkill,
  archiveSkill,
  restoreSkill,
  findOrCreateSkill,
} from "../../src/services/Skill/skillRemoteService.js";

const VERSION = "AAAAAAAAAAE=";
const NEXT_VERSION = "AAAAAAAAAAI=";

const SKILL = {
  id: "skill-test-123",
  name: "JavaScript",
  category: "technical",
  status: "active",
  rowVersion: VERSION,
};

function mockResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function withMockFetch(handler, action) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    const request = {
      url: String(url),
      method: options.method || "GET",
      body: options.body ? JSON.parse(options.body) : null,
    };

    requests.push(request);
    return handler(request);
  };

  try {
    await action(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function skillResponse(skill) {
  return mockResponse({ data: { skill } });
}

test("update forwards original rowVersion without refetch", async () => {
  await withMockFetch(
    (request) => {
      assert.equal(request.method, "PATCH");
      assert.equal(request.body.rowVersion, VERSION);
      assert.deepEqual(request.body.updates, {
        description: "Updated",
      });

      return skillResponse({
        ...SKILL,
        description: "Updated",
        rowVersion: NEXT_VERSION,
      });
    },
    async (requests) => {
      const result = await updateSkill(
        SKILL.id,
        { description: "Updated" },
        VERSION,
      );

      assert.equal(result.rowVersion, NEXT_VERSION);
      assert.equal(requests.length, 1);
    },
  );
});

test("archive forwards caller rowVersion without refetch", async () => {
  await withMockFetch(
    (request) => {
      assert.equal(request.method, "PATCH");
      assert.equal(request.body.archived, true);
      assert.equal(request.body.rowVersion, VERSION);

      return skillResponse({
        ...SKILL,
        status: "archived",
        rowVersion: NEXT_VERSION,
      });
    },
    async (requests) => {
      const result = await archiveSkill(SKILL.id, VERSION);

      assert.equal(result.status, "archived");
      assert.equal(requests.length, 1);
    },
  );
});

test("restore forwards caller rowVersion without refetch", async () => {
  await withMockFetch(
    (request) => {
      assert.equal(request.method, "PATCH");
      assert.equal(request.body.archived, false);
      assert.equal(request.body.rowVersion, VERSION);

      return skillResponse({
        ...SKILL,
        rowVersion: NEXT_VERSION,
      });
    },
    async (requests) => {
      const result = await restoreSkill(SKILL.id, VERSION);

      assert.equal(result.status, "active");
      assert.equal(requests.length, 1);
    },
  );
});

test("missing rowVersion blocks all three mutations", async () => {
  await withMockFetch(
    () => {
      throw new Error("Unexpected request.");
    },
    async (requests) => {
      for (const action of [
        () => updateSkill(SKILL.id, { name: "Updated" }),
        () => archiveSkill(SKILL.id),
        () => restoreSkill(SKILL.id),
      ]) {
        await assert.rejects(
          action(),
          (error) =>
            error.code === "SKILL_ROW_VERSION_REQUIRED" &&
            error.status === 409,
        );
      }

      assert.equal(requests.length, 0);
    },
  );
});

test("HTTP 409 conflict propagates without retry", async () => {
  await withMockFetch(
    () =>
      mockResponse(
        {
          code: "SKILL_VERSION_CONFLICT",
          message: "Skill was modified by another session.",
        },
        409,
      ),
    async (requests) => {
      await assert.rejects(
        updateSkill(
          SKILL.id,
          { description: "Stale update" },
          VERSION,
        ),
        (error) =>
          error.status === 409 &&
          error.code === "SKILL_VERSION_CONFLICT",
      );

      assert.equal(requests.length, 1);
    },
  );
});

test("findOrCreate restores matched archived Skill with its version", async () => {
  const archivedSkill = {
    ...SKILL,
    status: "archived",
  };

  await withMockFetch(
    (request) => {
      if (request.method === "GET") {
        return mockResponse({
          data: { skills: [archivedSkill] },
        });
      }

      assert.equal(request.method, "PATCH");
      assert.equal(request.body.archived, false);
      assert.equal(request.body.rowVersion, VERSION);

      return skillResponse({
        ...archivedSkill,
        status: "active",
        rowVersion: NEXT_VERSION,
      });
    },
    async (requests) => {
      const result = await findOrCreateSkill("JavaScript");

      assert.equal(result.created, false);
      assert.equal(result.restored, true);
      assert.equal(result.skill.rowVersion, NEXT_VERSION);

      assert.equal(requests.length, 2);
    },
  );
});