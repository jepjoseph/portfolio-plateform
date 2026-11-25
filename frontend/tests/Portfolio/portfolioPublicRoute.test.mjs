import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizePublicPortfolioRoute,
  getPublicPortfolioStyle,
  isSupportedPublicSnapshot,
} from "../../src/services/Portfolio/portfolioPublicRouteUtils.js";

import {
  createPortfolioApiService,
} from "../../src/services/Portfolio/portfolioApiService.js";

import {
  createPortfolioTransport,
} from "../../src/services/Portfolio/portfolioBackendService.js";

const validRoutes = [
  ["engineering-portfolio", "engineering-portfolio"],
  ["My-Portfolio", "my-portfolio"],
  ["g/example.user", "g/example.user"],
  ["y/example-user", "y/example-user"],
  ["i/example_user", "i/example_user"],
  ["o/example", "o/example"],
  ["  technical-portfolio  ", "technical-portfolio"],
  ["a", "a"],
];

for (const [input, expected] of validRoutes) {
  test(`accepts public route: ${input}`, () => {
    assert.equal(
      normalizePublicPortfolioRoute(input),
      expected,
    );
  });
}

const invalidRoutes = [
  null,
  undefined,
  123,
  "",
  "api",
  "admin",
  "dashboard",
  "portfolio",
  "projects",
  "settings",
  "about",
  "auth",
  "privacy",
  "robots.txt",
  "g",
  "o",
  "g/",
  "x/example",
  "g/example/extra",
  "../private",
  "name..example",
  "-example",
  "example-",
  "example?private=true",
  "example#private",
  "https://example.com",
  "g/example%2Fprivate",
  "a".repeat(201),
];

for (const [index, input] of invalidRoutes.entries()) {
  test(`rejects invalid route ${index + 1}`, () => {
    assert.equal(
      normalizePublicPortfolioRoute(input),
      null,
    );
  });
}

for (const style of [
  "professional",
  "modern",
  "technical",
  "academic",
]) {
  test(`supports ${style} style`, () => {
    assert.equal(
      getPublicPortfolioStyle(style),
      style,
    );
  });
}

test("unknown style uses professional fallback", () => {
  assert.equal(
    getPublicPortfolioStyle("unknown"),
    "professional",
  );
});

const snapshot = {
  schemaVersion: 1,
  title: "Test Portfolio",
  sections: [{
    sectionKey: "projects",
    sortOrder: 0,
    isVisible: true,
  }],
  projects: [{
    title: "Test Project",
  }],
};

test("accepts supported server snapshot", () => {
  assert.equal(
    isSupportedPublicSnapshot(snapshot),
    true,
  );
});

for (const invalid of [
  null,
  {},
  { ...snapshot, schemaVersion: 2 },
  { ...snapshot, sections: null },
  { ...snapshot, sections: [null] },
  { ...snapshot, title: 123 },
  { ...snapshot, projects: [null] },
  { ...snapshot, projects: "invalid" },
]) {
  test("rejects malformed snapshot", () => {
    assert.equal(
      isSupportedPublicSnapshot(invalid),
      false,
    );
  });
}

test("public custom URL uses correct API endpoint", async () => {
  const api = createPortfolioApiService(
    async (path, options) => {
      assert.equal(
        path,
        "/api/public/portfolios/test-portfolio",
      );

      assert.equal(options.method, "GET");

      return {
        status: "success",
        data: { snapshot },
      };
    },
  );

  const result = await api.getPublicPortfolio(
    "test-portfolio",
  );

  assert.deepEqual(result.snapshot, snapshot);
});

test("provider URL preserves separate path segments", async () => {
  const api = createPortfolioApiService(
    async (path, options) => {
      assert.equal(
        path,
        "/api/public/portfolios/g/example.user",
      );

      assert.equal(options.method, "GET");

      return {
        status: "success",
        data: { snapshot },
      };
    },
  );

  await api.getPublicPortfolio("g/example.user");
});

test("invalid public route does not call API", async () => {
  let calls = 0;

  const api = createPortfolioApiService(async () => {
    calls++;
  });

  await assert.rejects(
    async () => api.getPublicPortfolio("../private"),
  );

  assert.equal(calls, 0);
});

test("invalid API response is rejected", async () => {
  const api = createPortfolioApiService(async () => ({
    status: "error",
  }));

  await assert.rejects(
    api.getPublicPortfolio("test-portfolio"),
  );
});

test("transport does not duplicate API prefix", async () => {
  const transport = createPortfolioTransport(
    async (endpoint, options) => {
      assert.equal(
        endpoint,
        "/public/portfolios/g/example",
      );

      assert.equal(options.method, "GET");

      return { status: "success" };
    },
  );

  await transport(
    "/api/public/portfolios/g/example",
    { method: "GET" },
  );
});