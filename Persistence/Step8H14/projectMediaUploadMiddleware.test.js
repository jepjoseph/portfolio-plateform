import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import express from "express";
import supertest from "supertest";

import {
  uploadProjectMedia,
} from "../../src/middleware/project/projectMediaUploadMiddleware.js";

let temporaryDirectory;
let originalStoragePath;

const USER_ID = "user-123";
const PROJECT_ID = "project-456";

const JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0,
  0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01,
]);

before(async () => {
  temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "project-media-upload-test-"),
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

function createApp({
  userId = USER_ID,
  authorizedProjectId = PROJECT_ID,
} = {}) {
  const app = express();

  app.post(
    "/projects/:projectId/media",
    (request, response, next) => {
      if (userId !== null) {
        request.auth = { userId };
      }

      if (authorizedProjectId !== null) {
        request.authorizedProject = {
          id: authorizedProjectId,
        };
      }

      next();
    },
    uploadProjectMedia,
    (request, response) => {
      response.status(201).json({
        filename: request.file?.filename,
        mimetype: request.file?.mimetype,
        size: request.file?.size,
      });
    },
  );

  app.use((error, request, response, next) => {
    response.status(error.status || 500).json({
      code: error.code || "INTERNAL_ERROR",
      message: error.publicMessage || error.message,
    });
  });

  return app;
}

function uploadFile(app, {
  projectId = PROJECT_ID,
  filename = "sample.jpg",
  contentType = "image/jpeg",
  bytes = JPEG_BYTES,
} = {}) {
  return supertest(app)
    .post(`/projects/${projectId}/media`)
    .attach("media", bytes, {
      filename,
      contentType,
    });
}

test("rejects uploads without an authenticated user", async () => {
  const response = await uploadFile(
    createApp({ userId: null }),
  );

  assert.equal(response.status, 403);
  assert.equal(
    response.body.code,
    "PROJECT_MEDIA_UPLOAD_UNAUTHORIZED",
  );
});

test("rejects uploads without verified Project ownership", async () => {
  const response = await uploadFile(
    createApp({ authorizedProjectId: null }),
  );

  assert.equal(response.status, 403);
  assert.equal(
    response.body.code,
    "PROJECT_MEDIA_UPLOAD_UNAUTHORIZED",
  );
});

test("rejects mismatched Project ownership", async () => {
  const response = await uploadFile(
    createApp({ authorizedProjectId: "different-project" }),
  );

  assert.equal(response.status, 403);
  assert.equal(
    response.body.code,
    "PROJECT_MEDIA_UPLOAD_PROJECT_MISMATCH",
  );
});

test("rejects unsupported media MIME types", async () => {
  const response = await uploadFile(createApp(), {
    filename: "document.txt",
    contentType: "text/plain",
    bytes: Buffer.from("not an image"),
  });

  assert.equal(response.status, 400);
  assert.equal(
    response.body.code,
    "PROJECT_MEDIA_TYPE_NOT_ALLOWED",
  );
});

test("stores an authorized image in the Project directory", async () => {
  const response = await uploadFile(createApp());

  assert.equal(response.status, 201);
  assert.match(
    response.body.filename,
    /^[a-f0-9-]{36}\.jpg$/,
  );
  assert.equal(response.body.mimetype, "image/jpeg");
  assert.equal(response.body.size, JPEG_BYTES.length);

  const { getProjectMediaDirectory } = await import(
    "../../src/services/Storage/projectMediaStorageService.js"
  );

  const projectDirectory = getProjectMediaDirectory(
    USER_ID,
    PROJECT_ID,
  );

  const expectedFilePath = path.join(
    projectDirectory,
    response.body.filename,
  );

  const savedBytes = await fs.readFile(expectedFilePath);

  assert.deepEqual(
    savedBytes,
    JPEG_BYTES,
    "Stored file contents must match the uploaded bytes.",
  );

  const relativePath = path.relative(
    temporaryDirectory,
    expectedFilePath,
  );

  assert.ok(
    relativePath &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath),
    "Uploaded media must remain inside the temporary test directory.",
  );
});

