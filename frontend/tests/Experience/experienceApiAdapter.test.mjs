import test from "node:test";
import assert from "node:assert/strict";

import {
  prepareExperienceApiPayload,
  getExperienceRowVersion,
} from "../../src/services/Experience/experienceApiAdapter.js";

test("removes server-owned fields", () => {
  const experience = {
    id: "experience-123",
    category: "employment",
    position: {
      title: "Software Engineer",
    },
    userId: "user-123",
    user_id: "user-123",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
    rowVersion: "AAAAAAAAAAE=",
    recordStatus: "active",
    record_status: "active",
  };

  const result = prepareExperienceApiPayload(experience);

  assert.equal(result.id, "experience-123");
  assert.equal(result.position.title, "Software Engineer");

  for (const field of [
    "userId",
    "user_id",
    "createdAt",
    "updatedAt",
    "rowVersion",
    "recordStatus",
    "record_status",
  ]) {
    assert.equal(Object.hasOwn(result, field), false);
  }
});

test("does not mutate the original experience", () => {
  const experience = {
    id: "experience-123",
    position: {
      title: "Engineer",
    },
    createdAt: "2026-01-01",
  };

  const result = prepareExperienceApiPayload(experience);

  result.position.title = "Modified";

  assert.equal(experience.position.title, "Engineer");
  assert.equal(experience.createdAt, "2026-01-01");
});

test("rejects invalid experience objects", () => {
  for (const value of [
    null,
    undefined,
    [],
    "experience",
    123,
  ]) {
    assert.throws(
      () => prepareExperienceApiPayload(value),
      TypeError,
    );
  }
});

test("accepts a valid SQL Server rowVersion", () => {
  const result = getExperienceRowVersion({
    rowVersion: "AAAAAAAAAAE=",
  });

  assert.equal(result, "AAAAAAAAAAE=");
});

test("rejects invalid rowVersion values", () => {
  for (const rowVersion of [
    null,
    undefined,
    "",
    "invalid",
    "123",
    123,
  ]) {
    assert.throws(
      () => getExperienceRowVersion({ rowVersion }),
      TypeError,
    );
  }
});


test("rejects noncanonical SQL Server rowVersion padding bits", () => {
  const invalidVersion = "AAAAAAAAAAB=";

  assert.throws(
    () => getExperienceRowVersion({ rowVersion: invalidVersion }),
  );
});
