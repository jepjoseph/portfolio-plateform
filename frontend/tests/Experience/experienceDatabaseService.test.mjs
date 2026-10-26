import test from "node:test";
import assert from "node:assert/strict";

import * as databaseService from "../../src/services/Experience/experienceDatabaseService.js";

const requiredFunctions = [
  "getExperiences",
  "getExperienceById",
  "createExperience",
  "updateExperience",
  "archiveExperience",
  "restoreExperience",
  "deleteExperience",
  "validateExperienceDraft",
];

test("database service exposes the existing Experience interface", () => {
  for (const name of requiredFunctions) {
    assert.equal(typeof databaseService[name], "function", name);
  }
});

test("database service rejects update without a complete record", async () => {
  await assert.rejects(
    databaseService.updateExperience("experience-test", null),
    TypeError,
  );
});

test("database service rejects mismatched Experience IDs", async () => {
  await assert.rejects(
    databaseService.updateExperience("experience-first", {
      id: "experience-second",
      rowVersion: "AAAAAAAAAAA=",
    }),
    TypeError,
  );
});

test("database service rejects archive without rowVersion", async () => {
  await assert.rejects(
    databaseService.archiveExperience("experience-test", {
      id: "experience-test",
    }),
  );
});

test("database service rejects delete without rowVersion", async () => {
  await assert.rejects(
    databaseService.deleteExperience("experience-test", {
      id: "experience-test",
    }),
  );
});