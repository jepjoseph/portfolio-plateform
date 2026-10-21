import test from "node:test";
import assert from "node:assert/strict";

import {
  updateProjectApi,
  fetchProjects,
} from "../../src/services/Project/projectApiService.js";

import { ApiError } from "../../src/services/apiClient.js";

const ROW_VERSION = "AAAAAAAAAAE=";

async function withMockError(status, code, message, callback) {
  const originalFetch = globalThis.fetch;

  let requestCount = 0;

  globalThis.fetch = async () => {
    requestCount += 1;

    return new Response(
      JSON.stringify({
        status: "error",
        code,
        message,
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  };

  try {
    await callback(() => requestCount);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("409 conflict preserves backend error details", async () => {
  await withMockError(
    409,
    "PROJECT_VERSION_CONFLICT",
    "The Project was modified by another session.",
    async (getRequestCount) => {
      await assert.rejects(
        updateProjectApi(
          "project-test",
          { id: "project-test", title: "Updated Project" },
          ROW_VERSION,
        ),
        (error) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 409);
          assert.equal(error.code, "PROJECT_VERSION_CONFLICT");
          assert.equal(
            error.message,
            "The Project was modified by another session.",
          );
          return true;
        },
      );

      assert.equal(getRequestCount(), 1);
    },
  );
});

test("401 authentication error is preserved", async () => {
  await withMockError(
    401,
    "AUTHENTICATION_REQUIRED",
    "Authentication is required.",
    async () => {
      await assert.rejects(
        fetchProjects(),
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

test("500 server error is preserved", async () => {
  await withMockError(
    500,
    "INTERNAL_SERVER_ERROR",
    "An internal server error occurred.",
    async () => {
      await assert.rejects(
        fetchProjects(),
        (error) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 500);
          assert.equal(error.code, "INTERNAL_SERVER_ERROR");
          return true;
        },
      );
    },
  );
});
