import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeProject,
  normalizeProjectCollection,
  updateProjectModel,
} from "../../src/models/projectModel.js";

const ROW_VERSION = "AAAAAAAAAAE=";

test("normalizeProject preserves a backend rowVersion", () => {
  const project = normalizeProject({
    id: "project-test",
    title: "Test Project",
    rowVersion: ROW_VERSION,
  });

  assert.equal(project.rowVersion, ROW_VERSION);
});

test("normalizeProject does not invent a rowVersion", () => {
  const project = normalizeProject({
    id: "local-project",
    title: "Local Project",
  });

  assert.equal(
    Object.hasOwn(project, "rowVersion"),
    false,
  );
});

test("normalizeProjectCollection preserves rowVersion", () => {
  const projects = normalizeProjectCollection([
    {
      id: "project-test",
      title: "Test Project",
      rowVersion: ROW_VERSION,
    },
  ]);

  assert.equal(projects[0].rowVersion, ROW_VERSION);
});

test("updateProjectModel preserves the current rowVersion", () => {
  const updated = updateProjectModel(
    {
      id: "project-test",
      title: "Original Project",
      rowVersion: ROW_VERSION,
    },
    {
      title: "Updated Project",
    },
  );

  assert.equal(updated.rowVersion, ROW_VERSION);
});
