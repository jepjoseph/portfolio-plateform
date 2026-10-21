import test, { mock } from "node:test";
import assert from "node:assert/strict";

test("Project service loads with isolated storage dependencies", async () => {
  const assetWrites = [];
  const assetDeletes = [];
  let storedProjects = [];

  mock.module("../../src/services/Project/projectAssetStorage.js", {
    exports: {
      writeProjectAsset: async (asset) => {
        assetWrites.push(asset);

        if (asset.kind === "document") {
          throw new Error("Simulated document upload failure");
        }

        const assetId = asset.assetId || `test-asset-${assetWrites.length}`;

        return {
          storageKey:
            asset.storageKey || `test-storage-key-${assetWrites.length}`,
          projectId: asset.projectId,
          assetId,
          kind: asset.kind || "media",
          fileName: asset.file.name || "test-image.png",
          mimeType: asset.file.type || "image/png",
          fileSize: asset.file.size,
          updatedAt: new Date().toISOString(),
        };
      },
      deleteProjectAssets: async (keys) => {
        assetDeletes.push(...keys);
        return keys.length;
      },
      deleteProjectAssetsForProject: async () => 0,
    },
  });

  mock.module("../../src/services/Project/projectStorage.js", {
    exports: {
      readStoredProjects: () => structuredClone(storedProjects),

      replaceStoredProjects: (projects) => {
        storedProjects = structuredClone(projects);
        return structuredClone(storedProjects);
      },
    },
  });

  const service = await import("../../src/services/Project/projectService.js");

  assert.equal(typeof service.createProject, "function");
  assert.equal(typeof service.updateProject, "function");
  assert.equal(typeof service.deleteProject, "function");

  const projectData = {
    title: "Isolated Storage Test Project",
    role: "Full Stack Developer",
    dates: {
      startDate: "2026-10-20",
    },
    description: "A temporary Project created only in memory.",
  };

  const result = await service.createProject(projectData);

  assert.equal(result.project.title, "Isolated Storage Test Project");

  assert.equal(typeof result.project.id, "string");
  assert.ok(result.project.id.length > 0);
  assert.equal(storedProjects.length, 1);
  assert.equal(storedProjects[0].id, result.project.id);
  assert.equal(storedProjects[0].title, "Isolated Storage Test Project");

  const imageBlob = new Blob(["fake-image-content"], {
    type: "image/png",
  });

  const mediaProjectData = {
    title: "Project With Featured Media",
    role: "Full Stack Developer",
    dates: {
      startDate: "2026-10-20",
    },
  };

  const mediaResult = await service.createProject(mediaProjectData, {
    mediaUploads: [
      {
        id: "test-featured-image",
        file: imageBlob,
        type: "image",
        isFeatured: true,
        visibility: "public",
        status: "active",
      },
    ],
  });

  assert.equal(assetWrites.length, 1);
  assert.equal(assetWrites[0].projectId, mediaResult.project.id);

  assert.equal(mediaResult.project.media.length, 1);

  const savedMedia = mediaResult.project.media[0];

  assert.equal(savedMedia.storageKey, "test-storage-key-1");
  assert.equal(savedMedia.isFeatured, true);

  assert.equal(
    mediaResult.project.presentation.featuredMediaId,
    savedMedia.id,
  );

  assert.equal(storedProjects.length, 2);
  assert.equal(
    storedProjects[1].presentation.featuredMediaId,
    savedMedia.id,
  );

  assert.equal(assetWrites.length, 1);
  assert.deepEqual(assetDeletes, []);

  const countBeforeFailure = storedProjects.length;

  await assert.rejects(
    service.createProject(
      {
        title: "Project With Failed Document Upload",
        role: "Full Stack Developer",
        dates: { startDate: "2026-10-20" },
      },
      {
        mediaUploads: [
          {
            id: "rollback-media",
            file: new Blob(["temporary-image"], { type: "image/png" }),
            type: "image",
            isFeatured: true,
            visibility: "public",
            status: "active",
          },
        ],
        documentUploads: [
          {
            id: "failed-document",
            file: new Blob(["temporary-document"], {
              type: "application/pdf",
            }),
          },
        ],
      },
    ),
    /Simulated document upload failure/,
  );

  assert.equal(storedProjects.length, countBeforeFailure);
  assert.equal(assetWrites.length, 3);
  assert.deepEqual(assetDeletes, ["test-storage-key-2"]);
});
