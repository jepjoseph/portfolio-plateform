import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "./projectAssetStorage.js";

import {
  createProjectMediaObjectUrl,
} from "./projectMediaApiService.js";

import {
  createProjectDocumentObjectUrl,
} from "./projectDocumentApiService.js";

export function isBackendProjectAsset(asset) {
  return ["backend", "azure-sql"].includes(
    String(asset?.storageProvider || "").trim().toLowerCase(),
  );
}

export async function resolveProjectAssetUrl({
  projectId,
  asset,
  kind,
  signal,
}) {
  if (!asset) return "";

  if (isBackendProjectAsset(asset)) {
    if (!projectId || !asset.id) {
      throw new Error("Project and asset IDs are required for backend files.");
    }

    if (kind === "media") {
      return createProjectMediaObjectUrl(projectId, asset.id, { signal });
    }

    if (kind === "document") {
      return createProjectDocumentObjectUrl(projectId, asset.id, { signal });
    }

    throw new Error("Unsupported Project asset kind.");
  }

  if (asset.storageKey) {
    return createProjectAssetUrl(asset.storageKey);
  }

  return asset.externalUrl || "";
}

export function releaseProjectAssetUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    revokeProjectAssetUrl(url);
  }
}