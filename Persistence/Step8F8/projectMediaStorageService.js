import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { getEnvironment } from "../../config/environment.js";

function requireIdentifier(value, label) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(`${label} is required for Project media storage.`);
  }

  return normalized;
}

function hashIdentifier(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function validateFileName(fileName) {
  const normalized = String(fileName ?? "").trim();

  if (
    !normalized ||
    normalized === "." ||
    normalized === ".." ||
    normalized.includes("/") ||
    normalized.includes("\\") ||
    path.basename(normalized) !== normalized ||
    !/^[a-f0-9-]{36}\.(?:jpg|jpeg|png|webp|avif|gif|mp4|webm)$/i.test(
      normalized,
    )
  ) {
    throw new Error("Invalid Project media filename.");
  }

  return normalized;
}

export function getProjectMediaStorageRoot() {
  const environment = getEnvironment();

  const configuredPath = String(
    environment.PROJECT_MEDIA_STORAGE_PATH || "",
  ).trim();

  if (!configuredPath) {
    throw new Error("PROJECT_MEDIA_STORAGE_PATH is not configured.");
  }

  return path.resolve(configuredPath);
}

export function getProjectMediaUserDirectory(userId) {
  return hashIdentifier(requireIdentifier(userId, "User ID"));
}

export function getProjectMediaProjectDirectory(projectId) {
  return hashIdentifier(requireIdentifier(projectId, "Project ID"));
}

export function getProjectMediaDirectory(userId, projectId) {
  return path.join(
    getProjectMediaStorageRoot(),
    getProjectMediaUserDirectory(userId),
    getProjectMediaProjectDirectory(projectId),
  );
}

export function createProjectMediaStorageKey(userId, projectId, fileName) {
  const safeFileName = validateFileName(fileName);

  return [
    getProjectMediaUserDirectory(userId),
    getProjectMediaProjectDirectory(projectId),
    safeFileName,
  ].join("/");
}

export function resolveOwnedProjectMediaPath(userId, projectId, storageKey) {
  const normalizedKey = String(storageKey ?? "").trim();

  const expectedUserDirectory = getProjectMediaUserDirectory(userId);
  const expectedProjectDirectory = getProjectMediaProjectDirectory(projectId);

  const parts = normalizedKey.split("/");

  if (
    parts.length !== 3 ||
    parts[0] !== expectedUserDirectory ||
    parts[1] !== expectedProjectDirectory
  ) {
    throw new Error(
      "Project media storage key does not belong to this user and Project.",
    );
  }

  const safeFileName = validateFileName(parts[2]);

  const mediaDirectory = path.resolve(
    getProjectMediaDirectory(userId, projectId),
  );

  const filePath = path.resolve(mediaDirectory, safeFileName);

  if (path.dirname(filePath) !== mediaDirectory) {
    throw new Error("Project media path is outside the expected directory.");
  }

  return filePath;
}

export async function deleteOwnedProjectMedia(userId, projectId, storageKey) {
  const filePath = resolveOwnedProjectMediaPath(userId, projectId, storageKey);

  try {
    await fs.unlink(filePath);

    return {
      deleted: true,
      storageKey,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        deleted: false,
        storageKey,
      };
    }

    throw error;
  }
}
