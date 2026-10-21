import test from "node:test";
import assert from "node:assert/strict";

import {
  prepareFeaturedProjectMedia,
} from "../../src/services/Project/projectFeaturedMedia.js";

const existing = {
  id: "media-old",
  storageKey: "existing-asset",
  visibility: "public",
  status: "active",
  isFeatured: true,
};

const uploaded = {
  id: "media-new",
  storageKey: "new-asset",
  visibility: "public",
  status: "active",
  isFeatured: true,
};

test("newly uploaded featured media takes priority", () => {
  const result = prepareFeaturedProjectMedia(
    [existing],
    [uploaded],
    "media-old",
  );

  assert.equal(result.featuredMediaId, "media-new");
  assert.equal(
    result.media.filter((item) => item.isFeatured).length,
    1,
  );
  assert.equal(result.media[0].isFeatured, false);
  assert.equal(result.media[1].isFeatured, true);
});

test("existing featured media is preserved without uploads", () => {
  const result = prepareFeaturedProjectMedia(
    [existing],
    [],
    "media-old",
  );

  assert.equal(result.featuredMediaId, "media-old");
  assert.equal(result.media[0].isFeatured, true);
});

test("private media cannot be featured", () => {
  const result = prepareFeaturedProjectMedia(
    [{ ...existing, visibility: "private" }],
    [],
    "media-old",
  );

  assert.equal(result.featuredMediaId, "");
  assert.equal(result.media[0].isFeatured, false);
});

test("archived media cannot be featured", () => {
  const result = prepareFeaturedProjectMedia(
    [{ ...existing, status: "archived" }],
    [],
    "media-old",
  );

  assert.equal(result.featuredMediaId, "");
  assert.equal(result.media[0].isFeatured, false);
});

test("empty media collection has no featured media", () => {
  const result = prepareFeaturedProjectMedia([], [], "");

  assert.deepEqual(result.media, []);
  assert.equal(result.featuredMediaId, "");
});
