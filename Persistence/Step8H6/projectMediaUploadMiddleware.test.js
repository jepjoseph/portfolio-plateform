import assert from "node:assert/strict";
import { test } from "node:test";

import multer from "multer";

import {
  uploadProjectMedia,
} from "../../src/middleware/project/projectMediaUploadMiddleware.js";

function createRequest({
  userId = "user-123",
  projectId = "project-456",
  authorizedProjectId = "project-456",
} = {}) {
  return {
    auth: userId === null ? undefined : { userId },
    params: { projectId },
    authorizedProject:
      authorizedProjectId === null
        ? undefined
        : { id: authorizedProjectId },
    headers: {
      "content-type": "multipart/form-data; boundary=test-boundary",
    },
  };
}

async function executeUpload(request) {
  const errors = [];

  await new Promise((resolve) => {
    uploadProjectMedia(request, {}, (error) => {
      errors.push(error);
      resolve();
    });
  });

  assert.equal(errors.length, 1);

  return errors[0];
}

test("rejects uploads without an authenticated user", async () => {
  const request = createRequest({ userId: null });

  const error = await executeUpload(request);

  assert.ok(error);
  assert.equal(error.code, "PROJECT_MEDIA_UPLOAD_UNAUTHORIZED");
  assert.equal(error.status, 403);
});

test("rejects uploads without verified Project ownership", async () => {
  const request = createRequest({ authorizedProjectId: null });

  const error = await executeUpload(request);

  assert.ok(error);
  assert.equal(error.code, "PROJECT_MEDIA_UPLOAD_UNAUTHORIZED");
  assert.equal(error.status, 403);
});

test("rejects uploads when the authorized Project does not match", async () => {
  const request = createRequest({
    authorizedProjectId: "different-project",
  });

  const error = await executeUpload(request);

  assert.ok(error);
  assert.equal(error.code, "PROJECT_MEDIA_UPLOAD_PROJECT_MISMATCH");
  assert.equal(error.status, 403);
});

test("rejects unsupported media types", async () => {
  const request = createRequest();

  const error = await executeUpload(request);

  assert.ok(error);
  assert.ok(
    error instanceof multer.MulterError ||
      error.code === "PROJECT_MEDIA_TYPE_NOT_ALLOWED",
  );
});
