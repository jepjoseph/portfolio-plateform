import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeExperience,
  normalizeExperienceCollection,
  updateExperienceModel,
} from "../../src/models/experienceModel.js";

const ROW_VERSION = "AAAAAAAAAAE=";

test("preserves a valid backend rowVersion", () => {
  const result = normalizeExperience({
    id: "experience-123",
    rowVersion: ROW_VERSION,
  });

  assert.equal(result.rowVersion, ROW_VERSION);
});

test("does not add rowVersion to legacy records", () => {
  const result = normalizeExperience({
    id: "experience-123",
  });

  assert.equal(
    Object.hasOwn(result, "rowVersion"),
    false,
  );
});

test("does not preserve an invalid rowVersion", () => {
  const result = normalizeExperience({
    id: "experience-123",
    rowVersion: "invalid",
  });

  assert.equal(
    Object.hasOwn(result, "rowVersion"),
    false,
  );
});

test("preserves rowVersion during collection normalization", () => {
  const result = normalizeExperienceCollection([
    {
      id: "experience-123",
      rowVersion: ROW_VERSION,
    },
  ]);

  assert.equal(result[0].rowVersion, ROW_VERSION);
});

test("preserves rowVersion during model updates", () => {
  const current = normalizeExperience({
    id: "experience-123",
    rowVersion: ROW_VERSION,
  });

  const updated = updateExperienceModel(current, {
    position: {
      title: "Senior Engineer",
    },
  });

  assert.equal(updated.rowVersion, ROW_VERSION);
  assert.equal(updated.position.title, "Senior Engineer");
});