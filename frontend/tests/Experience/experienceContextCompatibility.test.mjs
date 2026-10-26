import test from "node:test";
import assert from "node:assert/strict";

import * as compatibility from "../../src/services/Experience/experienceContextCompatibility.js";

test("compatibility layer exports the required context methods", () => {
  for (const name of [
    "getExperiences",
    "getExperienceById",
    "createExperience",
    "updateExperience",
    "archiveExperience",
    "restoreExperience",
    "deleteExperience",
    "validateExperienceDraft",
  ]) {
    assert.equal(typeof compatibility[name], "function", name);
  }
});

test("update rejects an unavailable collection", async () => {
  await assert.rejects(
    compatibility.updateExperience(null, "experience-1", {}),
    /collection is required/,
  );
});

test("update rejects an Experience not loaded by React", async () => {
  await assert.rejects(
    compatibility.updateExperience([], "experience-1", {}),
    (error) => error.code === "EXPERIENCE_NOT_LOADED",
  );
});

test("update rejects a record without rowVersion", async () => {
  await assert.rejects(
    compatibility.updateExperience(
      [{ id: "experience-1" }],
      "experience-1",
      {},
    ),
    /rowVersion/,
  );
});

test("update rejects attempts to override server-owned fields", async () => {
  await assert.rejects(
    compatibility.updateExperience(
      [{ id: "experience-1", rowVersion: "AAAAAAAAAAA=" }],
      "experience-1",
      { rowVersion: "AAAAAAAAAAA=" },
    ),
    /server-owned fields/,
  );
});

test("archive rejects an unloaded record", async () => {
  await assert.rejects(
    compatibility.archiveExperience([], "experience-1"),
    (error) => error.code === "EXPERIENCE_NOT_LOADED",
  );
});

test("restore rejects a record without rowVersion", async () => {
  await assert.rejects(
    compatibility.restoreExperience(
      [{ id: "experience-1" }],
      "experience-1",
    ),
    /rowVersion/,
  );
});

test("delete rejects a record without rowVersion", async () => {
  await assert.rejects(
    compatibility.deleteExperience(
      [{ id: "experience-1" }],
      "experience-1",
    ),
    /rowVersion/,
  );
});