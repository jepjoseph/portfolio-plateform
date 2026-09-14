import {
  createProject as createProjectModel,
  createProjectDocument,
  createProjectMedia,
  createPublicProject,
  normalizeProject,
  updateProjectModel,
} from "../../models/projectModel.js";

import {
  deleteProjectAssets,
  deleteProjectAssetsForProject,
  writeProjectAsset,
} from "./projectAssetStorage.js";

import { readStoredProjects, replaceStoredProjects } from "./projectStorage.js";

import { validateProject } from "./projectValidation.js";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

/*
 * =========================================
 * Service Error
 * =========================================
 */

function createProjectServiceError(code, message, publicMessage, details = {}) {
  const error = new Error(message);

  error.name = "ProjectServiceError";
  error.code = code;
  error.publicMessage = publicMessage;

  Object.assign(error, details);

  return error;
}

/*
 * =========================================
 * Validate Project for Storage
 * =========================================
 */

function validateForSave(project, collections) {
  const validation = validateProject(project, collections);

  if (!validation.isValid) {
    throw createProjectServiceError(
      "PROJECT_VALIDATION_ERROR",
      "Project validation failed.",
      "Correct the highlighted Project fields before saving.",
      {
        validation,
        errors: validation.errors,
        warnings: validation.warnings,
        fieldErrors: validation.fieldErrors,
      },
    );
  }

  return validation;
}

/*
 * =========================================
 * Project Identifier Validation
 * =========================================
 */

function requireProjectId(projectId) {
  const normalizedProjectId = getText(projectId);

  if (!normalizedProjectId) {
    throw createProjectServiceError(
      "PROJECT_ID_REQUIRED",
      "A Project identifier is required.",
      "The selected Project could not be identified.",
    );
  }

  return normalizedProjectId;
}

/*
 * =========================================
 * Find Project
 * =========================================
 */

function findProjectIndex(records, projectId) {
  return records.findIndex((project) => project.id === projectId);
}

/*
 * =========================================
 * Duplicate Identity
 * =========================================
 *
 * Projects may share a title when they belong
 * to different organizations or clients.
 */

function createProjectIdentity(project) {
  const title = getText(project?.title).normalize("NFKC").toLocaleLowerCase();

  const organization = getText(
    project?.organization?.name || project?.organization?.clientName,
  )
    .normalize("NFKC")
    .toLocaleLowerCase();

  return {
    title,
    organization,
  };
}

function ensureUniqueProject(records, candidate, excludedProjectId = "") {
  const candidateIdentity = createProjectIdentity(candidate);

  if (!candidateIdentity.title) {
    return;
  }

  const duplicate = records.find((project) => {
    if (project.id === excludedProjectId) {
      return false;
    }

    const existingIdentity = createProjectIdentity(project);

    /*
     * When neither record identifies an
     * organization, the normalized title alone
     * is used to prevent accidental duplicates.
     */

    return (
      existingIdentity.title === candidateIdentity.title &&
      existingIdentity.organization === candidateIdentity.organization
    );
  });

  if (!duplicate) {
    return;
  }

  throw createProjectServiceError(
    "PROJECT_DUPLICATE",
    `A matching Project already exists: ${duplicate.id}`,
    candidateIdentity.organization
      ? "A Project with this title and organization already exists."
      : "A Project with this title already exists.",
    {
      project: duplicate,

      fieldErrors: {
        title: "A matching Project record already exists.",
      },
    },
  );
}

/*
 * =========================================
 * Store Upload Collection
 * =========================================
 */

async function storeProjectUploads(projectId, uploads, kind) {
  const uploadCollection = getArray(uploads);

  const metadata = [];

  const createdStorageKeys = [];

  try {
    for (let index = 0; index < uploadCollection.length; index += 1) {
      const upload = uploadCollection[index];

      if (!(upload?.file instanceof Blob)) {
        throw createProjectServiceError(
          "PROJECT_UPLOAD_FILE_INVALID",
          `Project ${kind} upload does not contain a valid Blob.`,
          `One of the selected Project ${
            kind === "media" ? "media files" : "documents"
          } is invalid.`,
        );
      }

      const storedAsset = await writeProjectAsset({
        file: upload.file,

        projectId,

        assetId: upload.assetId || upload.id,

        storageKey: upload.storageKey,

        kind,
      });

      createdStorageKeys.push(storedAsset.storageKey);

      const metadataValues = {
        ...upload,

        /*
         * File objects must never be included
         * in localStorage metadata.
         */

        file: undefined,

        id: storedAsset.assetId,

        fileName: storedAsset.fileName,

        mimeType: storedAsset.mimeType,

        fileSize: storedAsset.fileSize,

        storageProvider: "indexed-db",

        storageKey: storedAsset.storageKey,

        uploadedAt: storedAsset.updatedAt,
      };

      metadata.push(
        kind === "media"
          ? createProjectMedia(metadataValues, index)
          : createProjectDocument(metadataValues, index),
      );
    }

    return {
      metadata,
      createdStorageKeys,
    };
  } catch (error) {
    /*
     * If one upload fails, remove every asset
     * already created during this collection.
     */

    await deleteProjectAssets(createdStorageKeys).catch(() => {});

    throw error;
  }
}

/*
 * =========================================
 * Prepare Project Assets
 * =========================================
 */

async function prepareProjectAssets(
  project,
  { mediaUploads = [], documentUploads = [] } = {},
) {
  const storedMedia = await storeProjectUploads(
    project.id,
    mediaUploads,
    "media",
  );

  try {
    const storedDocuments = await storeProjectUploads(
      project.id,
      documentUploads,
      "document",
    );

    /*
     * A featured staged upload replaces the
     * previous featured item. Otherwise, the
     * existing featured selection is retained.
     */

    const uploadedFeaturedMedia = storedMedia.metadata.find(
      (mediaItem) => mediaItem.isFeatured && mediaItem.status !== "archived",
    );

    const existingMedia = getArray(project.media).map((mediaItem) => ({
      ...mediaItem,

      isFeatured: uploadedFeaturedMedia ? false : mediaItem.isFeatured,
    }));

    const completeMedia = [...existingMedia, ...storedMedia.metadata];

    const featuredMedia =
      uploadedFeaturedMedia ||
      completeMedia.find(
        (mediaItem) =>
          mediaItem.id === project.presentation?.featuredMediaId &&
          mediaItem.status !== "archived",
      ) ||
      completeMedia.find(
        (mediaItem) => mediaItem.isFeatured && mediaItem.status !== "archived",
      ) ||
      completeMedia.find((mediaItem) => mediaItem.status !== "archived") ||
      null;

    const preparedProject = normalizeProject({
      ...project,

      media: completeMedia.map((mediaItem) => ({
        ...mediaItem,

        isFeatured: mediaItem.id === featuredMedia?.id,
      })),

      supportingDocuments: [
        ...getArray(project.supportingDocuments),

        ...storedDocuments.metadata,
      ],

      presentation: {
        ...project.presentation,

        featuredMediaId: featuredMedia?.id || "",
      },
    });

    return {
      project: preparedProject,

      createdStorageKeys: [
        ...storedMedia.createdStorageKeys,
        ...storedDocuments.createdStorageKeys,
      ],
    };
  } catch (error) {
    /*
     * Document storage failed after media was
     * saved, so the new media must be rolled
     * back as well.
     */

    await deleteProjectAssets(storedMedia.createdStorageKeys).catch(() => {});

    throw error;
  }
}

/*
 * =========================================
 * Safe Removed-Asset Cleanup
 * =========================================
 */

async function removeUnreferencedAssets(project, requestedStorageKeys) {
  const referencedStorageKeys = new Set([
    ...getArray(project.media)
      .map((mediaItem) => getText(mediaItem.storageKey))
      .filter(Boolean),

    ...getArray(project.supportingDocuments)
      .map((documentRecord) => getText(documentRecord.storageKey))
      .filter(Boolean),
  ]);

  const removableStorageKeys = [
    ...new Set(getArray(requestedStorageKeys).map(getText).filter(Boolean)),
  ].filter((storageKey) => !referencedStorageKeys.has(storageKey));

  if (removableStorageKeys.length === 0) {
    return 0;
  }

  return deleteProjectAssets(removableStorageKeys);
}

/*
 * =========================================
 * Get Projects
 * =========================================
 */

export function getProjects({ includeArchived = false } = {}) {
  const projects = readStoredProjects();

  return includeArchived
    ? projects
    : projects.filter((project) => project.recordStatus !== "archived");
}

/*
 * =========================================
 * Get Project by ID
 * =========================================
 */

export function getProjectById(projectId, { includeArchived = true } = {}) {
  const normalizedProjectId = requireProjectId(projectId);

  const project =
    readStoredProjects().find((record) => record.id === normalizedProjectId) ||
    null;

  if (project?.recordStatus === "archived" && !includeArchived) {
    return null;
  }

  return project;
}

/*
 * =========================================
 * Public Projects
 * =========================================
 */

export function getPublicProjects() {
  return getProjects({
    includeArchived: false,
  }).map(createPublicProject);
}

/*
 * =========================================
 * Public Project by ID
 * =========================================
 */

export function getPublicProjectById(projectId) {
  const project = getProjectById(projectId, {
    includeArchived: false,
  });

  return project ? createPublicProject(project) : null;
}

/*
 * =========================================
 * Create Project
 * =========================================
 */

export async function createProject(
  projectData,
  {
    collections = {},
    mediaUploads = [],
    documentUploads = [],
    removedAssetStorageKeys = [],
  } = {},
) {
  const records = readStoredProjects();

  let project = createProjectModel(projectData);

  ensureUniqueProject(records, project);

  const preparedAssets = await prepareProjectAssets(project, {
    mediaUploads,
    documentUploads,
  });

  project = preparedAssets.project;

  try {
    const validation = validateForSave(project, collections);

    /*
     * Store metadata only after every staged
     * asset was written successfully.
     */

    replaceStoredProjects([...records, project]);

    /*
     * This collection is normally empty while
     * creating, but accepting it keeps the
     * service contract consistent.
     */

    await removeUnreferencedAssets(project, removedAssetStorageKeys).catch(
      () => {},
    );

    return {
      project,
      warnings: validation.warnings,
    };
  } catch (error) {
    /*
     * Metadata was not saved, so every new
     * IndexedDB asset must be removed.
     */

    await deleteProjectAssets(preparedAssets.createdStorageKeys).catch(
      () => {},
    );

    throw error;
  }
}

/*
 * =========================================
 * Update Project
 * =========================================
 */

export async function updateProject(
  projectId,
  updates,
  {
    collections = {},
    mediaUploads = [],
    documentUploads = [],
    removedAssetStorageKeys = [],
  } = {},
) {
  const normalizedProjectId = requireProjectId(projectId);

  const records = readStoredProjects();

  const projectIndex = findProjectIndex(records, normalizedProjectId);

  if (projectIndex < 0) {
    throw createProjectServiceError(
      "PROJECT_NOT_FOUND",
      `Project not found: ${normalizedProjectId}`,
      "The selected Project could not be found.",
      {
        projectId: normalizedProjectId,
      },
    );
  }

  let project = updateProjectModel(records[projectIndex], updates);

  ensureUniqueProject(records, project, project.id);

  const preparedAssets = await prepareProjectAssets(project, {
    mediaUploads,
    documentUploads,
  });

  project = preparedAssets.project;

  try {
    const validation = validateForSave(project, collections);

    const nextRecords = [...records];

    nextRecords[projectIndex] = project;

    /*
     * Save updated metadata before deleting
     * old assets. If this write fails, existing
     * files remain recoverable.
     */

    replaceStoredProjects(nextRecords);

    /*
     * Asset deletion occurs only after the new
     * Project record has been saved.
     */

    await removeUnreferencedAssets(project, removedAssetStorageKeys).catch(
      () => {},
    );

    return {
      project,
      warnings: validation.warnings,
    };
  } catch (error) {
    /*
     * Preserve all pre-existing files and remove
     * only assets created during this attempt.
     */

    await deleteProjectAssets(preparedAssets.createdStorageKeys).catch(
      () => {},
    );

    throw error;
  }
}

/*
 * =========================================
 * Archive Project
 * =========================================
 */

export async function archiveProject(projectId) {
  const normalizedProjectId = requireProjectId(projectId);

  const records = readStoredProjects();

  const projectIndex = findProjectIndex(records, normalizedProjectId);

  if (projectIndex < 0) {
    throw createProjectServiceError(
      "PROJECT_NOT_FOUND",
      `Project not found: ${normalizedProjectId}`,
      "The selected Project could not be found.",
      {
        projectId: normalizedProjectId,
      },
    );
  }

  const project = records[projectIndex];

  if (project.recordStatus === "archived") {
    return project;
  }

  const archivedProject = normalizeProject({
    ...project,

    recordStatus: "archived",

    updatedAt: new Date().toISOString(),
  });

  const nextRecords = [...records];

  nextRecords[projectIndex] = archivedProject;

  replaceStoredProjects(nextRecords);

  return archivedProject;
}

/*
 * =========================================
 * Restore Project
 * =========================================
 */

export async function restoreProject(projectId) {
  const normalizedProjectId = requireProjectId(projectId);

  const records = readStoredProjects();

  const projectIndex = findProjectIndex(records, normalizedProjectId);

  if (projectIndex < 0) {
    throw createProjectServiceError(
      "PROJECT_NOT_FOUND",
      `Project not found: ${normalizedProjectId}`,
      "The selected Project could not be found.",
      {
        projectId: normalizedProjectId,
      },
    );
  }

  const project = records[projectIndex];

  if (project.recordStatus === "active") {
    return project;
  }

  const restoredProject = normalizeProject({
    ...project,

    recordStatus: "active",

    updatedAt: new Date().toISOString(),
  });

  const nextRecords = [...records];

  nextRecords[projectIndex] = restoredProject;

  replaceStoredProjects(nextRecords);

  return restoredProject;
}

/*
 * =========================================
 * Delete Project Permanently
 * =========================================
 */

export async function deleteProject(projectId) {
  const normalizedProjectId = requireProjectId(projectId);

  const records = readStoredProjects();

  const projectIndex = findProjectIndex(records, normalizedProjectId);

  if (projectIndex < 0) {
    throw createProjectServiceError(
      "PROJECT_NOT_FOUND",
      `Project not found: ${normalizedProjectId}`,
      "The selected Project could not be found.",
      {
        projectId: normalizedProjectId,
      },
    );
  }

  const deletedProject = records[projectIndex];

  const nextRecords = records.filter(
    (project) => project.id !== normalizedProjectId,
  );

  /*
   * Delete metadata first. If localStorage
   * fails, the Project and all assets remain.
   */

  replaceStoredProjects(nextRecords);

  /*
   * Once metadata is removed, delete every
   * IndexedDB asset owned by this Project.
   *
   * Cleanup is best effort because the Project
   * metadata has already been deleted.
   */

  let assetCleanupError = null;

  try {
    await deleteProjectAssetsForProject(normalizedProjectId);
  } catch (error) {
    assetCleanupError = error;
  }

  return {
    ...deletedProject,

    assetCleanupWarning: assetCleanupError
      ? "The Project was deleted, but one or more locally stored files could not be cleaned up."
      : "",
  };
}
