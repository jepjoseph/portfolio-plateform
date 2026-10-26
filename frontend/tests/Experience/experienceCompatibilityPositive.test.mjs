import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyExperience,
} from "../../src/models/experienceModel.js";

import {
  updateExperience,
  archiveExperience,
  restoreExperience,
  deleteExperience,
} from "../../src/services/Experience/experienceContextCompatibility.js";

const VERSION = "AAAAAAAAAAA=";
const NEXT_VERSION = "AAAAAAAAAAE=";

function fixture() {
  const experience = createEmptyExperience();

  return {
    ...experience,
    id: "experience-test-1",
    rowVersion: VERSION,
    position: {
      ...experience.position,
      title: "Software Engineer",
    },
    organization: {
      ...experience.organization,
      name: "Example Organization",
    },
    dates: {
      ...experience.dates,
      startDate: "2025-01",
      isCurrent: true,
    },
    overview: "Existing description.",
    status: "active",
  };
}

async function withMockFetch(handler, action) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (input, options = {}) => {
    const request = {
      url: String(input),
      method: options.method || "GET",
      body: options.body ? JSON.parse(options.body) : null,
    };

    requests.push(request);

    const result = await handler(request);

    return new Response(
      JSON.stringify(result.body),
      {
        status: result.status || 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  };

  try {
    await action(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("partial update preserves nested fields and original rowVersion", async () => {
  const current = fixture();

  await withMockFetch(
    (request) => {
      assert.equal(request.method, "PUT");
      assert.equal(request.body.rowVersion, VERSION);

      const updated = request.body.experience;

      assert.equal(
        updated.position.title,
        "Senior Software Engineer",
      );

      assert.equal(
        updated.position.employmentType,
        current.position.employmentType,
      );

      assert.equal(
        updated.organization.name,
        current.organization.name,
      );

      assert.equal(
        updated.overview,
        current.overview,
      );

      assert.equal(
        Object.hasOwn(updated, "rowVersion"),
        false,
      );

      return {
        body: {
          data: {
            experience: {
              ...current,
              ...updated,
              rowVersion: NEXT_VERSION,
            },
          },
        },
      };
    },
    async (requests) => {
      const result = await updateExperience(
        [current],
        current.id,
        {
          position: {
            title: "Senior Software Engineer",
          },
        },
      );

      assert.equal(result.rowVersion, NEXT_VERSION);
      assert.equal(requests.length, 1);
    },
  );

  assert.equal(current.position.title, "Software Engineer");
  assert.equal(current.rowVersion, VERSION);
});

test("archive sends the loaded rowVersion", async () => {
  const current = fixture();

  await withMockFetch(
    (request) => {
      assert.equal(request.method, "PATCH");
      assert.equal(request.body.archived, true);
      assert.equal(request.body.rowVersion, VERSION);

      return {
        body: {
          data: {
            experience: {
              ...current,
              status: "archived",
              rowVersion: NEXT_VERSION,
            },
          },
        },
      };
    },
    async (requests) => {
      const result = await archiveExperience(
        [current],
        current.id,
      );

      assert.equal(result.status, "archived");
      assert.equal(result.rowVersion, NEXT_VERSION);
      assert.equal(requests.length, 1);
    },
  );
});

test("restore sends the loaded rowVersion", async () => {
  const current = {
    ...fixture(),
    status: "archived",
  };

  await withMockFetch(
    (request) => {
      assert.equal(request.method, "PATCH");
      assert.equal(request.body.archived, false);
      assert.equal(request.body.rowVersion, VERSION);

      return {
        body: {
          data: {
            experience: {
              ...current,
              status: "active",
              rowVersion: NEXT_VERSION,
            },
          },
        },
      };
    },
    async (requests) => {
      const result = await restoreExperience(
        [current],
        current.id,
      );

      assert.equal(result.status, "active");
      assert.equal(result.rowVersion, NEXT_VERSION);
      assert.equal(requests.length, 1);
    },
  );
});

test("delete sends the loaded rowVersion", async () => {
  const current = fixture();

  await withMockFetch(
    (request) => {
      assert.equal(request.method, "DELETE");
      assert.equal(request.body.rowVersion, VERSION);

      return {
        body: {
          data: {
            id: current.id,
            deleted: true,
          },
        },
      };
    },
    async (requests) => {
      const result = await deleteExperience(
        [current],
        current.id,
      );

      assert.equal(result.deleted, true);
      assert.equal(requests.length, 1);
    },
  );
});

test("backend concurrency conflicts propagate without retry", async () => {
  const current = fixture();

  await withMockFetch(
    () => ({
      status: 409,
      body: {
        success: false,
        error: {
          code: "EXPERIENCE_CONFLICT",
          message: "The record was modified elsewhere.",
        },
      },
    }),
    async (requests) => {
      await assert.rejects(
        archiveExperience([current], current.id),
        (error) => Number(error.status) === 409,
      );

      assert.equal(requests.length, 1);
    },
  );
});