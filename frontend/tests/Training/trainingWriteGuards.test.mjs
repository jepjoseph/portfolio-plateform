import test from "node:test";
import assert from "node:assert/strict";

import {
  updateTraining,
} from "../../src/services/Training/trainingService.js";

const TRAINING_ID = "training-isolated-test";
const ROW_VERSION = "AAAAAAAAAAE=";

async function withBlockedNetwork(action) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    requests.push({
      url: String(url),
      method: options.method ?? "GET",
    });

    throw new Error("Unexpected network request during isolated test.");
  };

  try {
    await action(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("update rejects missing original SQL version", async () => {
  await withBlockedNetwork(async (requests) => {
    await assert.rejects(
      updateTraining(TRAINING_ID, { title: "Updated title" }),
      (error) =>
        error.code === "TRAINING_ORIGINAL_VERSION_REQUIRED" &&
        error.status === 409,
    );

    assert.equal(requests.length, 0);
  });
});

test("update rejects a mismatched original Training ID", async () => {
  await withBlockedNetwork(async (requests) => {
    await assert.rejects(
      updateTraining(
        TRAINING_ID,
        { title: "Updated title" },
        {
          rowVersion: ROW_VERSION,
          originalTraining: {
            id: "another-training",
            rowVersion: ROW_VERSION,
          },
        },
      ),
      (error) =>
        error.code === "TRAINING_ORIGINAL_VERSION_REQUIRED",
    );

    assert.equal(requests.length, 0);
  });
});

test("update rejects a mismatched rowVersion", async () => {
  await withBlockedNetwork(async (requests) => {
    await assert.rejects(
      updateTraining(
        TRAINING_ID,
        { title: "Updated title" },
        {
          rowVersion: ROW_VERSION,
          originalTraining: {
            id: TRAINING_ID,
            rowVersion: "AAAAAAAAAAI=",
          },
        },
      ),
      (error) =>
        error.code === "TRAINING_ORIGINAL_VERSION_REQUIRED",
    );

    assert.equal(requests.length, 0);
  });
});

test("update rejects a missing Training ID", async () => {
  await withBlockedNetwork(async (requests) => {
    await assert.rejects(
      updateTraining("", { title: "Updated title" }),
      (error) =>
        error.code === "TRAINING_ID_REQUIRED" &&
        error.status === 400,
    );

    assert.equal(requests.length, 0);
  });
});