/*
 * =========================================
 * Certification Options
 * =========================================
 */

export const CERTIFICATION_TYPE_OPTIONS = [
  { value: "professional", label: "Professional Certification" },
  { value: "technical", label: "Technical Certification" },
  { value: "license", label: "Professional License" },
  { value: "vendor", label: "Vendor Credential" },
  { value: "academic", label: "Academic Certificate" },
  { value: "safety", label: "Safety or Compliance" },
  { value: "language", label: "Language Credential" },
  { value: "other", label: "Other" },
];

export const CERTIFICATION_ISSUER_TYPE_OPTIONS = [
  {
    value: "professional-association",
    label: "Professional Association",
  },
  {
    value: "technology-vendor",
    label: "Technology Vendor",
  },
  {
    value: "government",
    label: "Government or Regulatory Body",
  },
  {
    value: "educational-institution",
    label: "Educational Institution",
  },
  {
    value: "training-provider",
    label: "Training Provider",
  },
  {
    value: "employer",
    label: "Employer",
  },
  {
    value: "other",
    label: "Other",
  },
];

export const CERTIFICATION_CREDENTIAL_STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "planned", label: "Planned" },
];

export const CERTIFICATION_SOURCE_OPTIONS = [
  { value: "manual", label: "Manually Added" },
  { value: "training", label: "Created from Training" },
  { value: "education", label: "Created from Education" },
  { value: "imported", label: "Imported" },
  { value: "ai-suggested", label: "AI Suggested" },
];

export const CERTIFICATION_STATUS_OPTIONS = [
  { value: "active", label: "Active Record" },
  { value: "archived", label: "Archived Record" },
];

/*
 * =========================================
 * Document Options
 * =========================================
 */

export const CERTIFICATION_DOCUMENT_TYPE_OPTIONS = [
  { value: "certificate", label: "Certificate" },
  { value: "credential", label: "Credential" },
  { value: "verification", label: "Verification Document" },
  { value: "renewal", label: "Renewal Document" },
  { value: "supporting", label: "Supporting Document" },
  { value: "other", label: "Other" },
];

export const CERTIFICATION_DOCUMENT_MIME_TYPES = Object.freeze([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const CERTIFICATION_DOCUMENT_EXTENSIONS = Object.freeze([
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export const CERTIFICATION_DOCUMENT_ACCEPT = [
  ...CERTIFICATION_DOCUMENT_MIME_TYPES,
  ...CERTIFICATION_DOCUMENT_EXTENSIONS,
].join(",");

/*
 * =========================================
 * Field Limits
 * =========================================
 */

export const CERTIFICATION_FIELD_LIMITS = Object.freeze({
  name: 160,

  issuerName: 160,
  issuerWebsite: 500,

  credentialId: 180,
  verificationUrl: 1000,

  description: 2000,

  skillSnapshotName: 120,

  documentName: 255,
  documentDescription: 500,

  sourceContext: 300,
  privateNotes: 3000,

  maximumSkills: 50,
  maximumRelatedTrainingRecords: 50,
  maximumRelatedEducationRecords: 50,
  maximumSupportingDocuments: 20,

  maximumDocumentBytes: 10 * 1024 * 1024,
});

/*
 * =========================================
 * Document Helpers
 * =========================================
 */

export function getCertificationDocumentExtension(fileName) {
  const normalizedName =
    typeof fileName === "string" ? fileName.trim().toLocaleLowerCase() : "";

  const extensionIndex = normalizedName.lastIndexOf(".");

  return extensionIndex >= 0 ? normalizedName.slice(extensionIndex) : "";
}

export function isSupportedCertificationDocument(file) {
  if (!file || typeof file !== "object") {
    return false;
  }

  const mimeType =
    typeof file.type === "string" ? file.type.trim().toLocaleLowerCase() : "";

  const extension = getCertificationDocumentExtension(file.name);

  return (
    CERTIFICATION_DOCUMENT_EXTENSIONS.includes(extension) &&
    (!mimeType || CERTIFICATION_DOCUMENT_MIME_TYPES.includes(mimeType))
  );
}

export function isCertificationDocumentWithinSizeLimit(file) {
  return (
    file &&
    typeof file === "object" &&
    Number.isFinite(Number(file.size)) &&
    Number(file.size) > 0 &&
    Number(file.size) <= CERTIFICATION_FIELD_LIMITS.maximumDocumentBytes
  );
}

/*
 * Images and PDFs support visual browser previews.
 *
 * Word files use a document preview card because browsers cannot
 * reliably display local DOC and DOCX files without conversion.
 */

export function getCertificationDocumentPreviewMode(document) {
  const mimeType =
    typeof document?.mimeType === "string"
      ? document.mimeType.trim().toLocaleLowerCase()
      : typeof document?.type === "string"
        ? document.type.trim().toLocaleLowerCase()
        : "";

  const extension = getCertificationDocumentExtension(
    document?.fileName || document?.name,
  );

  if (
    mimeType.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp"].includes(extension)
  ) {
    return "image";
  }

  if (mimeType === "application/pdf" || extension === ".pdf") {
    return "pdf";
  }

  if ([".doc", ".docx"].includes(extension)) {
    return "word";
  }

  return "document";
}

/*
 * =========================================
 * Label Helpers
 * =========================================
 */

function getOptionLabel(options, value, fallback = "") {
  return options.find((option) => option.value === value)?.label || fallback;
}

export function getCertificationTypeLabel(value) {
  return getOptionLabel(CERTIFICATION_TYPE_OPTIONS, value, "Other");
}

export function getCertificationIssuerTypeLabel(value) {
  return getOptionLabel(CERTIFICATION_ISSUER_TYPE_OPTIONS, value, "Other");
}

export function getCertificationCredentialStateLabel(value) {
  return getOptionLabel(
    CERTIFICATION_CREDENTIAL_STATE_OPTIONS,
    value,
    "Active",
  );
}

export function getCertificationSourceLabel(value) {
  return getOptionLabel(CERTIFICATION_SOURCE_OPTIONS, value, "Manually Added");
}

export function getCertificationStatusLabel(value) {
  return getOptionLabel(CERTIFICATION_STATUS_OPTIONS, value, "Active Record");
}

export function getCertificationDocumentTypeLabel(value) {
  return getOptionLabel(
    CERTIFICATION_DOCUMENT_TYPE_OPTIONS,
    value,
    "Supporting Document",
  );
}
