import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import express from "express";
import supertest from "supertest";

import { uploadProjectMedia } from "../../src/middleware/project/projectMediaUploadMiddleware.js";
import { validateProjectMedia } from "../../src/middleware/project/projectMediaValidationMiddleware.js";
import { getProjectMediaDirectory } from "../../src/services/Storage/projectMediaStorageService.js";

const USER_ID = "validation-test-user";
const PROJECT_ID = "validation-test-project";

let temporaryDirectory;
let originalStoragePath;

before(async () => {
  temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "project-media-validation-test-"),
  );

  originalStoragePath = process.env.PROJECT_MEDIA_STORAGE_PATH;
  process.env.PROJECT_MEDIA_STORAGE_PATH = temporaryDirectory;
});

after(async () => {
  if (originalStoragePath === undefined) {
    delete process.env.PROJECT_MEDIA_STORAGE_PATH;
  } else {
    process.env.PROJECT_MEDIA_STORAGE_PATH = originalStoragePath;
  }

  if (temporaryDirectory) {
    await fs.rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
});

function createApp() {
  const app = express();

  app.post(
    "/projects/:projectId/media",
    (request, response, next) => {
      request.auth = { userId: USER_ID };
      request.authorizedProject = { id: PROJECT_ID };
      next();
    },
    uploadProjectMedia,
    validateProjectMedia,
    (request, response) => {
      response.status(201).json({
        verifiedMimeType: request.projectMediaFile?.verifiedMimeType,
        verifiedSize: request.projectMediaFile?.verifiedSize,
      });
    },
  );

  app.use((error, request, response, next) => {
    response.status(error.status || 500).json({
      code: error.code || "INTERNAL_ERROR",
    });
  });

  return app;
}

async function getStoredFiles() {
  const directory = getProjectMediaDirectory(USER_ID, PROJECT_ID);

  const relativePath = path.relative(temporaryDirectory, directory);

  assert.ok(
    relativePath &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath),
    "Test storage directory must be inside temporary storage.",
  );

  try {
    return await fs.readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

test("rejects a request without a media file", async () => {
  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .field("description", "No file supplied");

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "PROJECT_MEDIA_FILE_REQUIRED");
  assert.deepEqual(await getStoredFiles(), []);
});

test("rejects forged JPEG content and removes the uploaded file", async () => {
  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", Buffer.from("This is not a JPEG image."), {
      filename: "forged.jpg",
      contentType: "image/jpeg",
    });

  assert.equal(response.status, 400);
  assert.equal(
    response.body.code,
    "PROJECT_MEDIA_CONTENT_TYPE_NOT_ALLOWED",
  );
  assert.deepEqual(await getStoredFiles(), []);
});

test("rejects a mismatched MIME type and removes the uploaded file", async () => {
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
    "base64",
  );

  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", pngBytes, {
      filename: "mismatch.jpg",
      contentType: "image/jpeg",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "PROJECT_MEDIA_TYPE_MISMATCH");
  assert.deepEqual(await getStoredFiles(), []);
});
