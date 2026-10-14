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

test("accepts a valid PNG image and preserves its contents", async () => {
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
    "base64",
  );

  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", pngBytes, {
      filename: "valid.png",
      contentType: "image/png",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.verifiedMimeType, "image/png");
  assert.equal(response.body.verifiedSize, pngBytes.length);

  const projectDirectory = getProjectMediaDirectory(
    USER_ID,
    PROJECT_ID,
  );

  const storedFiles = await getStoredFiles();

  assert.equal(storedFiles.length, 1);
  assert.match(storedFiles[0], /^[a-f0-9-]{36}\.png$/);

  const storedBytes = await fs.readFile(
    path.join(projectDirectory, storedFiles[0]),
  );

  assert.deepEqual(storedBytes, pngBytes);
});

test("rejects PNG images exceeding 20 MiB and removes the file", async () => {
  const validPngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
    "base64",
  );

  const oversizedPng = Buffer.alloc(
    20 * 1024 * 1024 + 1,
  );

  validPngBytes.copy(oversizedPng);

  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", oversizedPng, {
      filename: "oversized.png",
      contentType: "image/png",
    });


  assert.equal(response.status, 413);
  assert.equal(response.body.code, "PROJECT_MEDIA_TOO_LARGE");

  const storedFiles = await getStoredFiles();

  assert.equal(
    storedFiles.length,
    1,
    "Oversized upload must not leave an additional file.",
  );
});




test("accepts an MP4 video with a recognized signature", async () => {
  const mp4Bytes = Buffer.from(
    "000000186674797069736F6D0000020069736F6D6D703431",
    "hex",
  );

  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", mp4Bytes, {
      filename: "sample.mp4",
      contentType: "video/mp4",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.verifiedMimeType, "video/mp4");
  assert.equal(response.body.verifiedSize, mp4Bytes.length);

  const projectDirectory = getProjectMediaDirectory(
    USER_ID,
    PROJECT_ID,
  );

  const storedFiles = await getStoredFiles();
  const mp4Files = storedFiles.filter((name) => name.endsWith(".mp4"));

  assert.equal(mp4Files.length, 1);
  assert.match(mp4Files[0], /^[a-f0-9-]{36}\.mp4$/);

  const storedBytes = await fs.readFile(
    path.join(projectDirectory, mp4Files[0]),
  );

  assert.deepEqual(storedBytes, mp4Bytes);
});

test("accepts a WebM video with a recognized signature", async () => {
  const webmBytes = Buffer.from(
    "1A45DFA39F4286810142F7810142F2810442F381084282847765626D4287810242858102",
    "hex",
  );

  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", webmBytes, {
      filename: "sample.webm",
      contentType: "video/webm",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.verifiedMimeType, "video/webm");
  assert.equal(response.body.verifiedSize, webmBytes.length);

  const projectDirectory = getProjectMediaDirectory(
    USER_ID,
    PROJECT_ID,
  );

  const storedFiles = await getStoredFiles();
  const webmFiles = storedFiles.filter((name) => name.endsWith(".webm"));

  assert.equal(webmFiles.length, 1);
  assert.match(webmFiles[0], /^[a-f0-9-]{36}\.webm$/);

  const storedBytes = await fs.readFile(
    path.join(projectDirectory, webmFiles[0]),
  );

  assert.deepEqual(storedBytes, webmBytes);
});

test("rejects MP4 uploads exceeding 100 MiB", async () => {
  const mp4Header = Buffer.from(
    "000000186674797069736F6D0000020069736F6D6D703431",
    "hex",
  );

  const oversizedMp4 = Buffer.alloc(
    100 * 1024 * 1024 + 1,
  );

  mp4Header.copy(oversizedMp4);

  const filesBefore = await getStoredFiles();

  const response = await supertest(createApp())
    .post(`/projects/${PROJECT_ID}/media`)
    .attach("media", oversizedMp4, {
      filename: "oversized.mp4",
      contentType: "video/mp4",
    });

  assert.equal(response.status, 413);
  assert.equal(response.body.code, "PROJECT_MEDIA_TOO_LARGE");

  const filesAfter = await getStoredFiles();

  assert.deepEqual(
    filesAfter.sort(),
    filesBefore.sort(),
    "Rejected video must not leave an additional stored file.",
  );
});
