import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const temporaryRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "project-media-test-"),
);

const previousStoragePath = process.env.PROJECT_MEDIA_STORAGE_PATH;

process.env.PROJECT_MEDIA_STORAGE_PATH = temporaryRoot;

const {
  getProjectMediaStorageRoot,
  getProjectMediaUserDirectory,
  getProjectMediaProjectDirectory,
  getProjectMediaDirectory,
  createProjectMediaStorageKey,
  resolveOwnedProjectMediaPath,
  deleteOwnedProjectMedia,
} = await import(
  "../../src/services/Storage/projectMediaStorageService.js"
);

const userId = "test-user-123";
const projectId = "test-project-456";
const fileName = "123e4567-e89b-42d3-a456-426614174000.jpg";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

after(async () => {
  if (previousStoragePath === undefined) {
    delete process.env.PROJECT_MEDIA_STORAGE_PATH;
  } else {
    process.env.PROJECT_MEDIA_STORAGE_PATH = previousStoragePath;
  }

  await fs.rm(temporaryRoot, {
    recursive: true,
    force: true,
  });
});

test("uses the configured Project media storage root", () => {
  assert.equal(getProjectMediaStorageRoot(), path.resolve(temporaryRoot));
});

test("hashes user and Project identifiers", () => {
  assert.equal(getProjectMediaUserDirectory(userId), sha256(userId));

  assert.equal(
    getProjectMediaProjectDirectory(projectId),
    sha256(projectId),
  );
});

test("constructs the correct Project media directory", () => {
  assert.equal(
    getProjectMediaDirectory(userId, projectId),
    path.join(
      temporaryRoot,
      sha256(userId),
      sha256(projectId),
    ),
  );
});

test("generates a relative storage key", () => {
  const storageKey = createProjectMediaStorageKey(
    userId,
    projectId,
    fileName,
  );

  assert.equal(
    storageKey,
    `${sha256(userId)}/${sha256(projectId)}/${fileName}`,
  );

  assert.equal(storageKey.includes("\\"), false);
});

test("resolves an owned media file inside its Project directory", () => {
  const storageKey = createProjectMediaStorageKey(
    userId,
    projectId,
    fileName,
  );

  assert.equal(
    resolveOwnedProjectMediaPath(userId, projectId, storageKey),
    path.join(
      temporaryRoot,
      sha256(userId),
      sha256(projectId),
      fileName,
    ),
  );
});

test("rejects access to another user's media", () => {
  const storageKey = createProjectMediaStorageKey(
    userId,
    projectId,
    fileName,
  );

  assert.throws(
    () => resolveOwnedProjectMediaPath("another-user", projectId, storageKey),
    /does not belong/,
  );
});

test("rejects access to another Project's media", () => {
  const storageKey = createProjectMediaStorageKey(
    userId,
    projectId,
    fileName,
  );

  assert.throws(
    () => resolveOwnedProjectMediaPath(userId, "another-project", storageKey),
    /does not belong/,
  );
});

test("rejects directory traversal in storage keys", () => {
  const userDirectory = sha256(userId);
  const projectDirectory = sha256(projectId);

  const invalidKeys = [
    `../${userDirectory}/${projectDirectory}/${fileName}`,
    `${userDirectory}/../${fileName}`,
    `${userDirectory}/${projectDirectory}/../${fileName}`,
    `${userDirectory}/${projectDirectory}/../../outside.jpg`,
    `${userDirectory}\\${projectDirectory}\\${fileName}`,
  ];

  for (const storageKey of invalidKeys) {
    assert.throws(
      () => resolveOwnedProjectMediaPath(userId, projectId, storageKey),
    );
  }
});

test("rejects invalid media filenames", () => {
  const invalidNames = [
    "../outside.jpg",
    "folder/image.jpg",
    "folder\\image.jpg",
    "image.exe",
    "image.jpg.exe",
    "",
  ];

  for (const invalidName of invalidNames) {
    assert.throws(
      () => createProjectMediaStorageKey(userId, projectId, invalidName),
      /Invalid Project media filename/,
    );
  }
});

test("rejects empty user and Project identifiers", () => {
  assert.throws(
    () => getProjectMediaUserDirectory(""),
    /User ID is required/,
  );

  assert.throws(
    () => getProjectMediaProjectDirectory(""),
    /Project ID is required/,
  );
});

test("deletes an existing owned media file", async () => {
  const storageKey = createProjectMediaStorageKey(
    userId,
    projectId,
    fileName,
  );

  const directory = getProjectMediaDirectory(userId, projectId);
  const filePath = resolveOwnedProjectMediaPath(
    userId,
    projectId,
    storageKey,
  );

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(filePath, "test media content");

  const result = await deleteOwnedProjectMedia(
    userId,
    projectId,
    storageKey,
  );

  assert.deepEqual(result, {
    deleted: true,
    storageKey,
  });

  await assert.rejects(
    fs.access(filePath),
    { code: "ENOENT" },
  );
});

test("returns deleted false when the media file is missing", async () => {
  const missingFileName =
    "123e4567-e89b-42d3-a456-426614174001.jpg";

  const storageKey = createProjectMediaStorageKey(
    userId,
    projectId,
    missingFileName,
  );

  const result = await deleteOwnedProjectMedia(
    userId,
    projectId,
    storageKey,
  );

  assert.deepEqual(result, {
    deleted: false,
    storageKey,
  });
});
