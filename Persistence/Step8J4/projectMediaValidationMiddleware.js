import fs from "node:fs/promises";
import path from "node:path";

import { fileTypeFromFile } from "file-type";

import {
  ALLOWED_MEDIA_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "./projectMediaUploadMiddleware.js";

import {
  getProjectMediaDirectory,
} from "../../services/Storage/projectMediaStorageService.js";

function createValidationError(message, code, status = 400) {
  const error = new Error(message);

  error.name = "ProjectMediaValidationError";
  error.code = code;
  error.status = status;
  error.publicMessage = message;

  return error;
}

function getAuthorizedFilePath(request) {
  const userId = String(request.auth?.userId ?? "").trim();
  const projectId = String(request.params?.projectId ?? "").trim();
  const authorizedProjectId = String(
    request.authorizedProject?.id ?? "",
  ).trim();

  if (!userId || !projectId || authorizedProjectId !== projectId) {
    throw createValidationError(
      "Project media validation is not authorized.",
      "PROJECT_MEDIA_VALIDATION_UNAUTHORIZED",
      403,
    );
  }

  const uploadedFile = request.file;

  if (!uploadedFile?.path) {
    throw createValidationError(
      "Please select a Project media file to upload.",
      "PROJECT_MEDIA_FILE_REQUIRED",
    );
  }

  const expectedDirectory = path.resolve(
    getProjectMediaDirectory(userId, projectId),
  );

  const uploadedPath = path.resolve(uploadedFile.path);

  if (path.dirname(uploadedPath) !== expectedDirectory) {
    throw createValidationError(
      "Project media file location is invalid.",
      "PROJECT_MEDIA_INVALID_FILE_LOCATION",
      403,
    );
  }

  return uploadedPath;
}

async function removeRejectedFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function validateProjectMedia(request, response, next) {
  let uploadedPath;

  try {
    uploadedPath = getAuthorizedFilePath(request);

    const uploadedFile = request.file;

    // Reject symbolic links and non-regular files before reading content.
    const stats = await fs.lstat(uploadedPath);

    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw createValidationError(
        "The uploaded media is not a regular file.",
        "PROJECT_MEDIA_INVALID_FILE",
      );
    }

    const detectedType = await fileTypeFromFile(uploadedPath);

    if (
      !detectedType ||
      !ALLOWED_MEDIA_TYPES.has(detectedType.mime)
    ) {
      throw createValidationError(
        "The uploaded file does not contain a supported media signature.",
        "PROJECT_MEDIA_CONTENT_TYPE_NOT_ALLOWED",
      );
    }

    if (detectedType.mime !== uploadedFile.mimetype) {
      throw createValidationError(
        "The uploaded media type does not match its contents.",
        "PROJECT_MEDIA_TYPE_MISMATCH",
      );
    }

    const maximumSize = detectedType.mime.startsWith("image/")
      ? MAX_IMAGE_SIZE
      : MAX_VIDEO_SIZE;


    if (stats.size > maximumSize) {
      throw createValidationError(
        "The uploaded media exceeds its permitted size.",
        "PROJECT_MEDIA_TOO_LARGE",
        413,
      );
    }

    request.projectMediaFile = {
      ...uploadedFile,
      verifiedMimeType: detectedType.mime,
      verifiedExtension: detectedType.ext,
      verifiedSize: stats.size,
    };

    return next();
  } catch (error) {
    if (uploadedPath) {
      try {
        await removeRejectedFile(uploadedPath);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up rejected Project media:",
          cleanupError,
        );

        return next(
          createValidationError(
            "Project media cleanup failed.",
            "PROJECT_MEDIA_CLEANUP_FAILED",
            500,
          ),
        );
      }
    }

    return next(error);
  }
}

