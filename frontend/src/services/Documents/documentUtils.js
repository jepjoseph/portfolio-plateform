import {
  DOCUMENT_FILE_FORMATS,
  DOCUMENT_FILE_LIMITS,
} from "../../config/documentConfig.js";

/*
 * =========================================
 * File Name Helpers
 * =========================================
 */

export function getFileExtension(fileName) {
  if (typeof fileName !== "string") {
    return "";
  }

  const normalizedName = fileName.trim();

  const lastDotIndex = normalizedName.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === normalizedName.length - 1) {
    return "";
  }

  return normalizedName.slice(lastDotIndex + 1).toLocaleLowerCase();
}

export function getDocumentFileFormat(fileOrMetadata) {
  const fileName =
    typeof fileOrMetadata === "string"
      ? fileOrMetadata
      : fileOrMetadata?.name || fileOrMetadata?.fileName || "";

  const mimeType =
    typeof fileOrMetadata === "object"
      ? String(
          fileOrMetadata?.type || fileOrMetadata?.mimeType || "",
        ).toLocaleLowerCase()
      : "";

  const extension = getFileExtension(fileName);

  return (
    DOCUMENT_FILE_FORMATS.find((format) => format.extension === extension) ||
    DOCUMENT_FILE_FORMATS.find((format) =>
      format.mimeTypes.includes(mimeType),
    ) ||
    null
  );
}

/*
 * =========================================
 * File Validation
 * =========================================
 */

export function validateDocumentFile(file) {
  const errors = [];

  if (!(file instanceof File)) {
    errors.push({
      field: "file",
      code: "file_required",
      message: "Select a document to upload.",
    });

    return {
      isValid: false,
      errors,
      format: null,
    };
  }

  const format = getDocumentFileFormat(file);

  if (!format) {
    errors.push({
      field: "file",
      code: "unsupported_file_type",
      message:
        "This file type is not supported. Upload a PDF, Word document, text document, or supported image.",
    });
  }

  if (file.size <= 0) {
    errors.push({
      field: "file",
      code: "empty_file",
      message: "The selected file is empty.",
    });
  }

  if (file.size > DOCUMENT_FILE_LIMITS.maximumFileSizeBytes) {
    errors.push({
      field: "file",
      code: "file_too_large",
      message: `The document cannot exceed ${formatFileSize(
        DOCUMENT_FILE_LIMITS.maximumFileSizeBytes,
      )}.`,
    });
  }

  if (file.name.length > DOCUMENT_FILE_LIMITS.fileName) {
    errors.push({
      field: "file",
      code: "file_name_too_long",
      message: `The file name cannot exceed ${DOCUMENT_FILE_LIMITS.fileName} characters.`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    format,
  };
}

/*
 * =========================================
 * File Display
 * =========================================
 */

export function formatFileSize(bytes) {
  const numericBytes = Number(bytes);

  if (!Number.isFinite(numericBytes) || numericBytes < 0) {
    return "";
  }

  if (numericBytes === 0) {
    return "0 bytes";
  }

  const units = ["bytes", "KB", "MB", "GB"];

  const unitIndex = Math.min(
    Math.floor(Math.log(numericBytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = numericBytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getDocumentFormatLabel(document) {
  return getDocumentFileFormat(document)?.label || "Document";
}

export function getDocumentFileFamily(document) {
  return getDocumentFileFormat(document)?.family || "other";
}

/*
 * =========================================
 * Preview Support
 * =========================================
 */

export function canPreviewDocument(document) {
  const family = getDocumentFileFamily(document);

  return family === "pdf" || family === "image" || family === "text";
}

export function shouldDownloadDocument(document) {
  return !canPreviewDocument(document);
}

/*
 * =========================================
 * Storage Key
 * =========================================
 */

export function createDocumentStorageKey(prefix = "document") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/*
 * =========================================
 * File Name Sanitization
 * =========================================
 */

export function sanitizeDocumentFileName(fileName) {
  const normalizedName = String(fileName || "")
    .normalize("NFKC")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ");

  return normalizedName.slice(0, DOCUMENT_FILE_LIMITS.fileName) || "document";
}
