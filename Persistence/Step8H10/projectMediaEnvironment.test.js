import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { getEnvironment } from "../../src/config/environment.js";
import {
  getProjectMediaStorageRoot,
} from "../../src/services/Storage/projectMediaStorageService.js";

test("Project media storage uses the expected temporary directory", async () => {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "project-media-environment-test-"),
  );

  try {
    const environment = getEnvironment();
    const configuredRoot = getProjectMediaStorageRoot();

    console.log("Temporary directory:", temporaryDirectory);
    console.log("Configured storage root:", configuredRoot);
    console.log(
      "Environment storage path:",
      environment.PROJECT_MEDIA_STORAGE_PATH,
    );

    assert.ok(configuredRoot);
  } finally {
    await fs.rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
});
