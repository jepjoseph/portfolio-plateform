import test from "node:test";
import assert from "node:assert/strict";

import {
  getExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  archiveExperience,
  restoreExperience,
  deleteExperience,
} from "../../src/services/Experience/experienceDatabaseService.js";

const originalFetch = globalThis.fetch;

const id = "experience-1234567890123-abcdefgh";
const rowVersion = "AAAAAAAAAAA=";

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(String(url), options);
  };
}

function response(data, status = 200) {
  const body = {
    status: status < 400 ? "success" : "error",
    data,
  };

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      "content-type": "application/json",
    }),
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

function experience(overrides = {}) {
  return {
    id,
    rowVersion,
    status: "active",
    position: { title: "Software Engineer" },
    organization: { name: "Example Organization" },
    ...overrides,
  };
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("retrieves active experiences", async () => {
  mockFetch(() =>
    response({
      experiences: [
        experience(),
        experience({
          id: "experience-1234567890124-abcdefgh",
          status: "archived",
        }),
      ],
    }),
  );

  const result = await getExperiences();

  assert.equal(result.length, 1);
  assert.equal(result[0].status, "active");
});

test("retrieves archived experiences when requested", async () => {
  mockFetch(() =>
    response({
      experiences: [
        experience(),
        experience({
          id: "experience-1234567890124-abcdefgh",
          status: "archived",
        }),
      ],
    }),
  );

  const result = await getExperiences({
    includeArchived: true,
  });

  assert.equal(result.length, 2);
});

test("retrieves one experience", async () => {
  mockFetch(() =>
    response({
      experience: experience(),
    }),
  );

  const result = await getExperienceById(id);

  assert.equal(result.id, id);
});

test("creates an experience", async () => {
  mockFetch(() =>
    response({
      experience: experience(),
    }, 201),
  );

  const result = await createExperience(experience());

  assert.equal(result.id, id);
});

test("updates an experience using rowVersion", async () => {
  let requestBody;

  mockFetch((url, options) => {
    requestBody = JSON.parse(options.body);

    return response({
      experience: experience({
        position: { title: "Senior Software Engineer" },
      }),
    });
  });

  await updateExperience(id, experience());

  assert.equal(requestBody.rowVersion, rowVersion);
  assert.equal(requestBody.experience.id, id);
});

test("archives an experience using rowVersion", async () => {
  let requestBody;

  mockFetch((url, options) => {
    requestBody = JSON.parse(options.body);

    return response({
      experience: experience({
        status: "archived",
      }),
    });
  });

  const result = await archiveExperience(id, experience());

  assert.equal(requestBody.archived, true);
  assert.equal(requestBody.rowVersion, rowVersion);
  assert.equal(result.status, "archived");
});

test("restores an experience using rowVersion", async () => {
  let requestBody;

  mockFetch((url, options) => {
    requestBody = JSON.parse(options.body);

    return response({
      experience: experience(),
    });
  });

  const result = await restoreExperience(id, experience({
    status: "archived",
  }));

  assert.equal(requestBody.archived, false);
  assert.equal(requestBody.rowVersion, rowVersion);
  assert.equal(result.status, "active");
});

test("deletes an experience using rowVersion", async () => {
  let requestBody;

  mockFetch((url, options) => {
    requestBody = JSON.parse(options.body);

    return response({
      deleted: true,
    });
  });

  await deleteExperience(id, experience());

  assert.equal(requestBody.rowVersion, rowVersion);
});

test("does not retry a concurrency conflict", async () => {
  let requests = 0;

  mockFetch(() => {
    requests++;

    return response({
      message: "Experience was modified.",
    }, 409);
  });

  await assert.rejects(
    updateExperience(id, experience()),
  );

  assert.equal(requests, 1);
});