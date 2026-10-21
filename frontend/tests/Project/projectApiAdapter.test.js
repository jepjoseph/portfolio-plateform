import test from "node:test";
import assert from "node:assert/strict";

import {
  prepareProjectApiPayload,
  getProjectRowVersion,
} from "../../src/services/Project/projectApiAdapter.js";

test("removes server-owned Project fields", () => {
  const project = {
    id: "project-test",
    title: "Test Project",
    userId: "user-123",
    user_id: "user-123",
    createdAt: "2026-10-20",
    updatedAt: "2026-10-20",
    rowVersion: "AAAAAAAAAAE=",
    presentation: {
      isFeatured: false,
    },
  };

  const payload = prepareProjectApiPayload(project);

  for (const field of [
    "userId",
    "user_id",
    "createdAt",
    "updatedAt",
    "rowVersion",
  ]) {
    assert.equal(Object.hasOwn(payload, field), false);
  }

  assert.equal(payload.title, "Test Project");
  assert.deepEqual(payload.presentation, {
    isFeatured: false,
  });
});

test("does not modify the original Project", () => {
  const project = {
    id: "project-test",
    createdAt: "2026-10-20",
    presentation: {
      isFeatured: true,
    },
  };

  const payload = prepareProjectApiPayload(project);

  assert.equal(project.createdAt, "2026-10-20");
  assert.notStrictEqual(payload, project);
  assert.notStrictEqual(payload.presentation, project.presentation);
});

test("rejects invalid Project payloads", () => {
  for (const value of [null, undefined, [], "invalid", 42]) {
    assert.throws(
      () => prepareProjectApiPayload(value),
      TypeError,
    );
  }
});

test("accepts a valid Base64 rowVersion", () => {
  assert.equal(
    getProjectRowVersion({
      rowVersion: "AAAAAAAAAAE=",
    }),
    "AAAAAAAAAAE=",
  );
});

test("rejects missing or invalid rowVersions", () => {
  for (const value of [
    undefined,
    "",
    "invalid",
    123,
  ]) {
    assert.throws(
      () => getProjectRowVersion({ rowVersion: value }),
      TypeError,
    );
  }
});
