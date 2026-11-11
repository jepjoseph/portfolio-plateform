import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyTraining } from "../../src/models/trainingModel.js";

import {
  createTraining,
  updateTraining,
  unlinkTrainingCertification,
  archiveTraining,
  restoreTraining,
  deleteTraining,
} from "../../src/services/Training/trainingService.js";

const ID = "training-synthetic-test";
const VERSION = "AAAAAAAAAAE=";
const NEXT_VERSION = "AAAAAAAAAAI=";

function fixture(overrides = {}) {
  return {
    ...createEmptyTraining(),
    id: ID,
    title: "Synthetic Training Test",
    provider: {
      name: "Example Training Provider",
      type: "training-company",
      website: "",
    },
    dates: {
      startDate: "2026-10-01",
      endDate: "2026-10-05",
      isCurrent: false,
    },
    completion: {
      status: "completed",
      durationHours: 12,
      certificateEarned: false,
      credentialId: "",
      credentialUrl: "",
    },
    ...overrides,
  };
}

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function withMockFetch(handler, action) {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    const request = {
      url: String(url),
      method: options.method ?? "GET",
      credentials: options.credentials,
      body: options.body ? JSON.parse(options.body) : null,
    };

    requests.push(request);
    return handler(request);
  };

  try {
    await action(requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function noNetwork() {
  throw new Error("Unexpected HTTP request.");
}

function metadata(original) {
  return {
    rowVersion: VERSION,
    originalTraining: original,
  };
}

function assertTrainingEndpoint(request, method) {
  assert.equal(request.method, method);
  assert.equal(
    new URL(request.url).pathname,
    `/api/trainings${method === "PATCH" ? `/${ID}` : ""}`,
  );
  assert.equal(request.credentials, "include");
}

test("Create sends one valid Training POST", async () => {
  const draft = fixture();

  await withMockFetch(
    (request) => response({
      data: {
        training: {
          ...request.body,
          id: ID,
          rowVersion: VERSION,
        },
      },
    }, 201),
    async (requests) => {
      const result = await createTraining(draft);

      assert.equal(requests.length, 1);
      assertTrainingEndpoint(requests[0], "POST");
      assert.equal(requests[0].body.title, draft.title);
      assert.equal(requests[0].body.modelVersion, 2);
      assert.equal(result.rowVersion, VERSION);
    },
  );
});

test("Create normalizes numeric duration strings", async () => {
  const draft = fixture({
    completion: {
      ...fixture().completion,
      durationHours: "12",
    },
  });

  await withMockFetch(
    (request) => {
      assert.equal(request.body.completion.durationHours, 12);
      assert.equal(
        typeof request.body.completion.durationHours,
        "number",
      );

      return response({
        data: { training: { ...request.body, rowVersion: VERSION } },
      }, 201);
    },
    async (requests) => {
      await createTraining(draft);
      assert.equal(requests.length, 1);
    },
  );
});

test("Create blocks supporting documents", async () => {
  const draft = fixture({
    supportingDocuments: [{
      id: "synthetic-document",
      name: "Example PDF",
      fileName: "example.pdf",
      mimeType: "application/pdf",
      storageKey: "synthetic-test-storage/example.pdf",
      documentType: "supporting-evidence",
      visibility: "private",
    }],
  });

  await withMockFetch(noNetwork, async (requests) => {
    await assert.rejects(
      createTraining(draft),
      (error) =>
        error.code ===
        "TRAINING_RELATIONSHIP_OR_DOCUMENT_WRITE_NOT_READY",
    );

    assert.equal(requests.length, 0);
  });
});

test("Create blocks skill relationships", async () => {
  const draft = fixture({
    skillRelationships: [{
      id: "synthetic-skill-relationship",
      skillId: "synthetic-skill",
      nameSnapshot: "JavaScript",
      categorySnapshot: "",
      typeSnapshot: "",
      order: 0,
    }],
  });

  await withMockFetch(noNetwork, async (requests) => {
    await assert.rejects(
      createTraining(draft),
      (error) =>
        error.code ===
        "TRAINING_RELATIONSHIP_OR_DOCUMENT_WRITE_NOT_READY",
    );

    assert.equal(requests.length, 0);
  });
});

test("Update sends only changed title and rowVersion", async () => {
  const original = {
    ...fixture(),
    rowVersion: VERSION,
  };

  await withMockFetch(
    (request) => response({
      data: {
        training: {
          ...original,
          title: "Updated Synthetic Training",
          rowVersion: NEXT_VERSION,
        },
      },
    }),
    async (requests) => {
      const result = await updateTraining(
        ID,
        { title: "Updated Synthetic Training" },
        metadata(original),
      );

      assert.equal(requests.length, 1);
      assertTrainingEndpoint(requests[0], "PATCH");

      assert.deepEqual(requests[0].body, {
        updates: { title: "Updated Synthetic Training" },
        rowVersion: VERSION,
      });

      assert.equal(result.rowVersion, NEXT_VERSION);
    },
  );
});

test("Update preserves existing PDF metadata", async () => {
  const document = {
    id: "synthetic-pdf",
    documentType: "supporting-evidence",
    name: "Existing PDF",
    description: "",
    fileName: "existing.pdf",
    mimeType: "application/pdf",
    fileSize: 1000,
    storageProvider: "local",
    storageKey: "synthetic-storage-key",
    fileUrl: "",
    uploadedAt: "",
    visibility: "private",
    order: 0,
  };

  const original = {
    ...fixture({ supportingDocuments: [document] }),
    rowVersion: VERSION,
  };

  await withMockFetch(
    (request) => {
      assert.deepEqual(request.body.updates, {
        title: "Updated title",
      });

      return response({
        data: {
          training: {
            ...original,
            title: "Updated title",
            rowVersion: NEXT_VERSION,
          },
        },
      });
    },
    async (requests) => {
      const result = await updateTraining(
        ID,
        { title: "Updated title" },
        metadata(original),
      );

      assert.equal(requests.length, 1);
      assert.deepEqual(result.supportingDocuments, [document]);
      assert.deepEqual(original.supportingDocuments, [document]);
    },
  );
});

test("Update rejects modified PDF metadata", async () => {
  const original = {
    ...fixture({
      supportingDocuments: [{
        id: "synthetic-pdf",
        name: "Existing PDF",
        fileName: "existing.pdf",
      }],
    }),
    rowVersion: VERSION,
  };

  await withMockFetch(noNetwork, async (requests) => {
    await assert.rejects(
      updateTraining(
        ID,
        {
          supportingDocuments: [{
            id: "synthetic-pdf",
            name: "Changed PDF",
            fileName: "existing.pdf",
          }],
        },
        metadata(original),
      ),
      (error) =>
        error.code ===
        "TRAINING_RELATIONSHIP_OR_DOCUMENT_WRITE_NOT_READY",
    );

    assert.equal(requests.length, 0);
  });
});

test("Update rejects modified relationships", async () => {
  const original = {
    ...fixture(),
    rowVersion: VERSION,
  };

  await withMockFetch(noNetwork, async (requests) => {
    await assert.rejects(
      updateTraining(
        ID,
        { relatedEducationIds: ["synthetic-education"] },
        metadata(original),
      ),
      (error) =>
        error.code ===
        "TRAINING_RELATIONSHIP_OR_DOCUMENT_WRITE_NOT_READY",
    );

    assert.equal(requests.length, 0);
  });
});

test("Unchanged Update sends no HTTP request", async () => {
  const original = {
    ...fixture(),
    rowVersion: VERSION,
  };

  await withMockFetch(noNetwork, async (requests) => {
    const result = await updateTraining(
      ID,
      { title: original.title },
      metadata(original),
    );

    assert.equal(result, original);
    assert.equal(requests.length, 0);
  });
});

test("HTTP 409 conflict propagates without retry", async () => {
  const original = {
    ...fixture(),
    rowVersion: VERSION,
  };

  await withMockFetch(
    () => response({
      code: "TRAINING_VERSION_CONFLICT",
      message: "Training was modified by another session.",
    }, 409),
    async (requests) => {
      await assert.rejects(
        updateTraining(
          ID,
          { title: "Stale update" },
          metadata(original),
        ),
        (error) =>
          error.status === 409 &&
          error.code === "TRAINING_VERSION_CONFLICT",
      );

      assert.equal(requests.length, 1);
    },
  );
});

test("Archive, Restore and Delete remain disabled", async () => {
  await withMockFetch(noNetwork, async (requests) => {
    for (const action of [
      () => archiveTraining(ID),
      () => restoreTraining(ID),
      () => deleteTraining(ID),
    ]) {
      await assert.rejects(
        action(),
        (error) =>
          error.code === "TRAINING_BACKEND_WRITE_NOT_READY",
      );
    }

    assert.equal(requests.length, 0);
  });
});
test("Unlink sends dedicated DELETE with rowVersion and preserves returned metadata", async () => {
  const certificationId = "certification-synthetic-test";
  const document = { id: "synthetic-pdf", fileName: "original.pdf" };
  const saved = fixture({
    rowVersion: NEXT_VERSION,
    supportingDocuments: [document],
    certificationRelationships: [],
    relatedCertificationIds: [],
  });
  await withMockFetch(
    () => response({ data: { training: saved } }),
    async (requests) => {
      const result = await unlinkTrainingCertification(ID, certificationId, VERSION);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].method, "DELETE");
      assert.equal(new URL(requests[0].url).pathname,
        `/api/trainings/${ID}/certification-links/${certificationId}`);
      assert.equal(requests[0].credentials, "include");
      assert.deepEqual(requests[0].body, { rowVersion: VERSION });
      assert.deepEqual(result, saved);
      assert.deepEqual(result.supportingDocuments, [document]);
    },
  );
});

test("Unlink HTTP 409 propagates without retry", async () => {
  await withMockFetch(
    () => response({ code: "TRAINING_VERSION_CONFLICT", message: "Stale version" }, 409),
    async (requests) => {
      await assert.rejects(
        unlinkTrainingCertification(ID, "certification-synthetic-test", VERSION),
        (error) => error.status === 409 && error.code === "TRAINING_VERSION_CONFLICT",
      );
      assert.equal(requests.length, 1);
    },
  );
});

test("Unlink rejects missing Certification ID or version without network", async () => {
  await withMockFetch(noNetwork, async (requests) => {
    await assert.rejects(unlinkTrainingCertification(ID, "", VERSION), TypeError);
    await assert.rejects(unlinkTrainingCertification(ID, "certification-synthetic-test", ""), TypeError);
    assert.equal(requests.length, 0);
  });
});

test("Unlink rejects malformed success response", async () => {
  await withMockFetch(
    () => response({ data: { training: { id: ID } } }),
    async (requests) => {
      await assert.rejects(
        unlinkTrainingCertification(ID, "certification-synthetic-test", VERSION),
        (error) => error instanceof TypeError && /unlink response/i.test(error.message),
      );
      assert.equal(requests.length, 1);
    },
  );
});