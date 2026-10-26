import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchExperiences,
  fetchExperienceById,
  createExperienceApi,
  updateExperienceApi,
  setExperienceArchivedApi,
  deleteExperienceApi,
} from "../../src/services/Experience/experienceApiService.js";

const ROW_VERSION = "AAAAAAAAAAE=";

const EXPERIENCE = {
  id: "experience-123",
  category: "employment",
  position: {
    title: "Software Engineer",
  },
  organization: {
    name: "MoticH",
  },
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  rowVersion: ROW_VERSION,
};

function mockResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function withMockFetch(handler, callback) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    const request = {
      url: String(url),
      method: options.method,
      credentials: options.credentials,
      body: options.body,
      headers: options.headers,
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

  assert.equal(
    new URL(request.url).pathname,
    `/api${path}`,
  );

  assert.equal(request.credentials, "include");
}

function parseBody(request) {
  return JSON.parse(request.body);
}

test("GET retrieves the Experience collection", async () => {
  await withMockFetch(
    () =>
      mockResponse({
        data: {
          experiences: [EXPERIENCE],
        },
      }),
    async (requests) => {
      const result = await fetchExperiences();

      assert.deepEqual(result, [EXPERIENCE]);
      assert.equal(requests.length, 1);

      assertEndpoint(
        requests[0],
        "GET",
        "/experiences",
      );
    },
  );
});

test("GET retrieves one Experience by ID", async () => {
  await withMockFetch(
    () =>
      mockResponse({
        data: {
          experience: EXPERIENCE,
        },
      }),
    async (requests) => {
      const result = await fetchExperienceById(
        EXPERIENCE.id,
      );

      assert.deepEqual(result, EXPERIENCE);

      assertEndpoint(
        requests[0],
        "GET",
        `/experiences/${EXPERIENCE.id}`,
      );
    },
  );
});

test("POST creates an Experience without server-owned fields", async () => {
  await withMockFetch(
    () =>
      mockResponse(
        {
          data: {
            experience: EXPERIENCE,
          },
        },
        201,
      ),
    async (requests) => {
      const result = await createExperienceApi(EXPERIENCE);

      assert.deepEqual(result, EXPERIENCE);

      assertEndpoint(
        requests[0],
        "POST",
        "/experiences",
      );

      const body = parseBody(requests[0]);

      assert.equal(body.id, EXPERIENCE.id);
      assert.equal(
        body.position.title,
        "Software Engineer",
      );

      assert.equal(
        Object.hasOwn(body, "createdAt"),
        false,
      );

      assert.equal(
        Object.hasOwn(body, "updatedAt"),
        false,
      );

      assert.equal(
        Object.hasOwn(body, "rowVersion"),
        false,
      );

      // Original object must remain unchanged.
      assert.equal(
        EXPERIENCE.rowVersion,
        ROW_VERSION,
      );
    },
  );
});

test("PUT updates an Experience with rowVersion", async () => {
  await withMockFetch(
    () =>
      mockResponse({
        data: {
          experience: EXPERIENCE,
        },
      }),
    async (requests) => {
      const result = await updateExperienceApi(
        EXPERIENCE.id,
        EXPERIENCE,
        ROW_VERSION,
      );

      assert.deepEqual(result, EXPERIENCE);

      assertEndpoint(
        requests[0],
        "PUT",
        `/experiences/${EXPERIENCE.id}`,
      );

      const body = parseBody(requests[0]);

      assert.equal(body.rowVersion, ROW_VERSION);

      assert.equal(
        body.experience.position.title,
        "Software Engineer",
      );

      assert.equal(
        Object.hasOwn(
          body.experience,
          "rowVersion",
        ),
        false,
      );
    },
  );
});

test("PATCH archives an Experience with rowVersion", async () => {
  await withMockFetch(
    () =>
      mockResponse({
        data: {
          experience: {
            ...EXPERIENCE,
            status: "archived",
          },
        },
      }),
    async (requests) => {
      const result = await setExperienceArchivedApi(
        EXPERIENCE.id,
        true,
        ROW_VERSION,
      );

      assert.equal(result.status, "archived");

      assertEndpoint(
        requests[0],
        "PATCH",
        `/experiences/${EXPERIENCE.id}/archive`,
      );

      assert.deepEqual(
        parseBody(requests[0]),
        {
          archived: true,
          rowVersion: ROW_VERSION,
        },
      );
    },
  );
});

test("PATCH restores an archived Experience", async () => {
  await withMockFetch(
    () =>
      mockResponse({
        data: {
          experience: EXPERIENCE,
        },
      }),
    async (requests) => {
      const result = await setExperienceArchivedApi(
        EXPERIENCE.id,
        false,
        ROW_VERSION,
      );

      assert.equal(result.status, "active");

      assert.deepEqual(
        parseBody(requests[0]),
        {
          archived: false,
          rowVersion: ROW_VERSION,
        },
      );
    },
  );
});

test("DELETE sends rowVersion in the request body", async () => {
  await withMockFetch(
    () =>
      mockResponse({
        data: {
          deleted: true,
        },
      }),
    async (requests) => {
      const result = await deleteExperienceApi(
        EXPERIENCE.id,
        ROW_VERSION,
      );

      assert.deepEqual(result, {
        deleted: true,
      });

      assertEndpoint(
        requests[0],
        "DELETE",
        `/experiences/${EXPERIENCE.id}`,
      );

      assert.deepEqual(
        parseBody(requests[0]),
        {
          rowVersion: ROW_VERSION,
        },
      );
    },
  );
});

test("rejects invalid rowVersion before sending a request", async () => {
  await withMockFetch(
    () => {
      throw new Error("Request should not be sent.");
    },
    async (requests) => {
      await assert.rejects(
        updateExperienceApi(
          EXPERIENCE.id,
          EXPERIENCE,
          "invalid",
        ),
        TypeError,
      );

      await assert.rejects(
        setExperienceArchivedApi(
          EXPERIENCE.id,
          true,
          "",
        ),
        TypeError,
      );

      await assert.rejects(
        deleteExperienceApi(
          EXPERIENCE.id,
          null,
        ),
        TypeError,
      );

      assert.equal(requests.length, 0);
    },
  );
});

test("rejects invalid Experience IDs", async () => {
  await assert.rejects(
    fetchExperienceById(""),
    TypeError,
  );

  await assert.rejects(
    fetchExperienceById(null),
    TypeError,
  );
});

test("preserves backend validation errors", async () => {
  await withMockFetch(
    () =>
      mockResponse(
        {
          code: "EXPERIENCE_VALIDATION_FAILED",
          message: "Experience validation failed.",
          fieldErrors: {
            "position.title": "Title is required.",
          },
        },
        400,
      ),
    async () => {
      await assert.rejects(
        createExperienceApi(EXPERIENCE),
        (error) => {
          assert.equal(error.status, 400);

          assert.equal(
            error.code,
            "EXPERIENCE_VALIDATION_FAILED",
          );

          assert.equal(
            error.fieldErrors["position.title"],
            "Title is required.",
          );

          return true;
        },
      );
    },
  );
});

test("preserves concurrency conflict errors", async () => {
  await withMockFetch(
    () =>
      mockResponse(
        {
          code: "EXPERIENCE_CONFLICT",
          message: "Experience was modified.",
        },
        409,
      ),
    async () => {
      await assert.rejects(
        updateExperienceApi(
          EXPERIENCE.id,
          EXPERIENCE,
          ROW_VERSION,
        ),
        (error) => {
          assert.equal(error.status, 409);
          assert.equal(
            error.code,
            "EXPERIENCE_CONFLICT",
          );

          return true;
        },
      );
    },
  );
});

test("preserves authentication errors", async () => {
  await withMockFetch(
    () =>
      mockResponse(
        {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required.",
        },
        401,
      ),
    async () => {
      await assert.rejects(
        fetchExperiences(),
        (error) => {
          assert.equal(error.status, 401);

          assert.equal(
            error.code,
            "AUTHENTICATION_REQUIRED",
          );

          return true;
        },
      );
    },
  );
});