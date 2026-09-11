/*
 * =========================================
 * Document Categories
 * =========================================
 */

export const DOCUMENT_CATEGORY_OPTIONS = [
  {
    value: "education",
    label: "Education",
  },
  {
    value: "training",
    label: "Training",
  },
  {
    value: "certification",
    label: "Certification",
  },
  {
    value: "project",
    label: "Project",
  },
  {
    value: "experience",
    label: "Experience",
  },
  {
    value: "general",
    label: "General",
  },
];

/*
 * =========================================
 * Education Document Types
 * =========================================
 */

export const EDUCATION_DOCUMENT_TYPE_OPTIONS = [
  {
    value: "diploma",
    label: "Diploma",
  },
  {
    value: "transcript",
    label: "Transcript",
  },
  {
    value: "degree-certificate",
    label: "Degree Certificate",
  },
  {
    value: "enrollment-verification",
    label: "Enrollment Verification",
  },
  {
    value: "graduation-verification",
    label: "Graduation Verification",
  },
  {
    value: "academic-award",
    label: "Academic Award",
  },
  {
    value: "recommendation-letter",
    label: "Recommendation Letter",
  },
  {
    value: "course-document",
    label: "Course Document",
  },
  {
    value: "evaluation",
    label: "Credential Evaluation",
  },
  {
    value: "other",
    label: "Other Document",
  },
];

/*
 * =========================================
 * Visibility
 * =========================================
 */

export const DOCUMENT_VISIBILITY_OPTIONS = [
  {
    value: "private",
    label: "Private",
    description: "Available only for private account management.",
  },
  {
    value: "shareable",
    label: "Shareable",
    description: "Can be selected for a résumé or portfolio.",
  },
  {
    value: "public",
    label: "Public",
    description: "Can be displayed publicly when selected.",
  },
];

/*
 * =========================================
 * Supported File Formats
 * =========================================
 */

export const DOCUMENT_FILE_FORMATS = [
  {
    extension: "pdf",
    label: "PDF",
    family: "pdf",
    mimeTypes: ["application/pdf"],
  },
  {
    extension: "doc",
    label: "Microsoft Word",
    family: "word",
    mimeTypes: ["application/msword"],
  },
  {
    extension: "docx",
    label: "Microsoft Word",
    family: "word",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  {
    extension: "odt",
    label: "OpenDocument Text",
    family: "word",
    mimeTypes: ["application/vnd.oasis.opendocument.text"],
  },
  {
    extension: "rtf",
    label: "Rich Text",
    family: "text",
    mimeTypes: ["application/rtf", "text/rtf"],
  },
  {
    extension: "txt",
    label: "Text Document",
    family: "text",
    mimeTypes: ["text/plain"],
  },
  {
    extension: "jpg",
    label: "JPEG Image",
    family: "image",
    mimeTypes: ["image/jpeg"],
  },
  {
    extension: "jpeg",
    label: "JPEG Image",
    family: "image",
    mimeTypes: ["image/jpeg"],
  },
  {
    extension: "png",
    label: "PNG Image",
    family: "image",
    mimeTypes: ["image/png"],
  },
  {
    extension: "webp",
    label: "WebP Image",
    family: "image",
    mimeTypes: ["image/webp"],
  },
  {
    extension: "gif",
    label: "GIF Image",
    family: "image",
    mimeTypes: ["image/gif"],
  },
  {
    extension: "bmp",
    label: "Bitmap Image",
    family: "image",
    mimeTypes: ["image/bmp"],
  },
  {
    extension: "heic",
    label: "HEIC Image",
    family: "image",
    mimeTypes: ["image/heic", "image/heif"],
  },
];

/*
 * =========================================
 * File Limits
 * =========================================
 */

export const DOCUMENT_FILE_LIMITS = {
  maximumFileSizeBytes: 15 * 1024 * 1024,

  maximumDocumentsPerRecord: 20,

  documentName: 250,

  fileName: 255,

  description: 1000,

  storageKey: 250,

  fileUrl: 1000,
};

/*
 * =========================================
 * Accept Attribute
 * =========================================
 */

export const DOCUMENT_ACCEPT_VALUE = [
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
].join(",");

/*
 * =========================================
 * Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getEducationDocumentTypeOption(value) {
  return findOption(EDUCATION_DOCUMENT_TYPE_OPTIONS, value);
}

export function getEducationDocumentTypeLabel(value) {
  return getEducationDocumentTypeOption(value)?.label || "Other Document";
}

export function getDocumentVisibilityOption(value) {
  return findOption(DOCUMENT_VISIBILITY_OPTIONS, value);
}

export function getDocumentVisibilityLabel(value) {
  return getDocumentVisibilityOption(value)?.label || "Private";
}

export function isValidEducationDocumentType(value) {
  return Boolean(getEducationDocumentTypeOption(value));
}

export function isValidDocumentVisibility(value) {
  return Boolean(getDocumentVisibilityOption(value));
}
