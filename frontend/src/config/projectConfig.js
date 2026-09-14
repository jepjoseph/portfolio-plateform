/*
 * =========================================
 * Project Categories
 * =========================================
 */

export const PROJECT_CATEGORY_OPTIONS = [
  {
    value: "software",
    label: "Software Development",
  },
  {
    value: "web-application",
    label: "Web Application",
  },
  {
    value: "mobile-application",
    label: "Mobile Application",
  },
  {
    value: "artificial-intelligence",
    label: "Artificial Intelligence",
  },
  {
    value: "data",
    label: "Data and Analytics",
  },
  {
    value: "cloud-infrastructure",
    label: "Cloud and Infrastructure",
  },
  {
    value: "networking",
    label: "Networking",
  },
  {
    value: "cybersecurity",
    label: "Cybersecurity",
  },
  {
    value: "embedded-systems",
    label: "Embedded Systems",
  },
  {
    value: "electronics",
    label: "Electronics",
  },
  {
    value: "automation",
    label: "Automation",
  },
  {
    value: "internet-of-things",
    label: "Internet of Things",
  },
  {
    value: "research",
    label: "Research",
  },
  {
    value: "design",
    label: "Design",
  },
  {
    value: "business",
    label: "Business or Startup",
  },
  {
    value: "academic",
    label: "Academic Project",
  },
  {
    value: "community",
    label: "Community Project",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
 * =========================================
 * Project Lifecycle
 * =========================================
 *
 * This represents the actual lifecycle of the
 * project. It is separate from recordStatus,
 * which controls library archiving.
 */

export const PROJECT_LIFECYCLE_STATUS_OPTIONS = [
  {
    value: "planned",
    label: "Planned",
  },
  {
    value: "in-progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "maintained",
    label: "Maintained",
  },
  {
    value: "paused",
    label: "Paused",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

/*
 * =========================================
 * Project Ownership
 * =========================================
 */

export const PROJECT_OWNERSHIP_OPTIONS = [
  {
    value: "individual",
    label: "Individual Project",
  },
  {
    value: "team",
    label: "Team Project",
  },
  {
    value: "client",
    label: "Client Project",
  },
  {
    value: "organization",
    label: "Organization Project",
  },
];

/*
 * =========================================
 * Record Sources
 * =========================================
 */

export const PROJECT_SOURCE_OPTIONS = [
  {
    value: "manual",
    label: "Manually Added",
  },
  {
    value: "import",
    label: "Imported",
  },
  {
    value: "integration",
    label: "Integration",
  },
  {
    value: "ai-assisted",
    label: "AI Assisted",
  },
];

/*
 * =========================================
 * Record Status
 * =========================================
 */

export const PROJECT_RECORD_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

/*
 * =========================================
 * Demonstrated Skill Proficiency
 * =========================================
 *
 * This describes the proficiency demonstrated
 * specifically within a Project. It can differ
 * from the general Skill Library proficiency.
 */

export const PROJECT_SKILL_PROFICIENCY_OPTIONS = [
  {
    value: "",
    label: "Not Specified",
  },
  {
    value: "foundational",
    label: "Foundational",
  },
  {
    value: "intermediate",
    label: "Intermediate",
  },
  {
    value: "advanced",
    label: "Advanced",
  },
  {
    value: "expert",
    label: "Expert",
  },
];

/*
 * =========================================
 * Technology Categories
 * =========================================
 */

export const PROJECT_TECHNOLOGY_CATEGORY_OPTIONS = [
  {
    value: "",
    label: "Not Specified",
  },
  {
    value: "programming-language",
    label: "Programming Language",
  },
  {
    value: "framework-library",
    label: "Framework or Library",
  },
  {
    value: "database",
    label: "Database",
  },
  {
    value: "cloud-platform",
    label: "Cloud Platform",
  },
  {
    value: "infrastructure",
    label: "Infrastructure",
  },
  {
    value: "networking",
    label: "Networking",
  },
  {
    value: "hardware",
    label: "Hardware",
  },
  {
    value: "embedded-platform",
    label: "Embedded Platform",
  },
  {
    value: "development-tool",
    label: "Development Tool",
  },
  {
    value: "design-tool",
    label: "Design Tool",
  },
  {
    value: "testing-tool",
    label: "Testing Tool",
  },
  {
    value: "methodology",
    label: "Methodology",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
 * =========================================
 * Recognition Types
 * =========================================
 */

export const PROJECT_RECOGNITION_TYPE_OPTIONS = [
  {
    value: "",
    label: "Not Specified",
  },
  {
    value: "award",
    label: "Award",
  },
  {
    value: "competition",
    label: "Competition",
  },
  {
    value: "grant",
    label: "Grant",
  },
  {
    value: "fellowship",
    label: "Fellowship",
  },
  {
    value: "showcase",
    label: "Showcase Selection",
  },
  {
    value: "publication",
    label: "Publication",
  },
  {
    value: "presentation",
    label: "Presentation",
  },
  {
    value: "patent",
    label: "Patent or Invention",
  },
  {
    value: "media",
    label: "Media Recognition",
  },
  {
    value: "client-recognition",
    label: "Client Recognition",
  },
  {
    value: "academic-recognition",
    label: "Academic Recognition",
  },
  {
    value: "other",
    label: "Other Recognition",
  },
];

/*
 * =========================================
 * Award Placements
 * =========================================
 */

export const PROJECT_AWARD_PLACEMENT_OPTIONS = [
  {
    value: "",
    label: "Not Specified",
  },
  {
    value: "winner",
    label: "Winner",
  },
  {
    value: "first-place",
    label: "First Place",
  },
  {
    value: "second-place",
    label: "Second Place",
  },
  {
    value: "third-place",
    label: "Third Place",
  },
  {
    value: "finalist",
    label: "Finalist",
  },
  {
    value: "semifinalist",
    label: "Semifinalist",
  },
  {
    value: "honorable-mention",
    label: "Honorable Mention",
  },
  {
    value: "selected",
    label: "Selected",
  },
  {
    value: "recipient",
    label: "Recipient",
  },
  {
    value: "participant",
    label: "Participant",
  },
  {
    value: "other",
    label: "Other Placement",
  },
];

/*
 * =========================================
 * Media Types
 * =========================================
 */

export const PROJECT_MEDIA_TYPE_OPTIONS = [
  {
    value: "image",
    label: "Image",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "diagram",
    label: "Architecture Diagram",
  },
];

/*
 * =========================================
 * Document Types
 * =========================================
 */

export const PROJECT_DOCUMENT_TYPE_OPTIONS = [
  {
    value: "report",
    label: "Report",
  },
  {
    value: "presentation",
    label: "Presentation",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
  {
    value: "source-file",
    label: "Source File or Archive",
  },
  {
    value: "dataset",
    label: "Dataset",
  },
  {
    value: "design",
    label: "Design Document",
  },
  {
    value: "award",
    label: "Award Evidence",
  },
  {
    value: "supporting-evidence",
    label: "Supporting Evidence",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
 * =========================================
 * Asset Visibility
 * =========================================
 */

export const PROJECT_ASSET_VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
  },
  {
    value: "private",
    label: "Private",
  },
];

/*
 * =========================================
 * Accepted Media Files
 * =========================================
 */

export const PROJECT_MEDIA_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
].join(",");

/*
 * =========================================
 * Accepted Document Files
 * =========================================
 */

export const PROJECT_DOCUMENT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".zip",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
].join(",");

/*
 * =========================================
 * Field Limits
 * =========================================
 *
 * These limits should later be mirrored in
 * backend validation and database columns.
 */

export const PROJECT_FIELD_LIMITS = Object.freeze({
  title: 200,
  role: 160,

  organizationName: 200,
  clientName: 200,
  website: 1000,

  locationDisplayValue: 300,

  url: 2000,

  problemStatement: 4000,
  targetAudience: 1000,
  context: 3000,
  importance: 3000,

  overview: 4000,
  approach: 4000,
  architecture: 4000,

  outcome: 4000,
  problemsSolved: 3000,
  impact: 3000,
  beneficiariesAffected: 2000,
  lessonsLearned: 3000,
  futureImprovements: 3000,

  shortSummary: 500,
  caseStudy: 12000,

  orderedItemText: 1500,

  metricLabel: 200,
  metricValue: 200,
  metricDescription: 500,

  relationshipName: 200,
  relationshipDescription: 1000,

  skillProficiency: 50,

  technologyName: 150,
  technologyCategory: 100,

  awardName: 250,
  awardOrganization: 250,
  awardRecognitionType: 100,
  awardPlacement: 100,
  awardDescription: 1500,

  mediaName: 255,
  mediaCaption: 1000,
  mediaAltText: 500,

  documentName: 255,
  documentDescription: 1000,

  sourceContext: 500,
  privateNotes: 5000,

  maximumObjectives: 25,
  maximumConstraints: 25,
  maximumFeatures: 40,
  maximumContributions: 40,
  maximumMetrics: 25,

  maximumSkills: 60,
  maximumTechnologies: 60,
  maximumRelationshipsPerType: 50,

  maximumAwards: 20,
  maximumAwardDocuments: 10,

  maximumMedia: 30,
  maximumDocuments: 30,

  maximumImageBytes: 12 * 1024 * 1024,
  maximumVideoBytes: 150 * 1024 * 1024,
  maximumDocumentBytes: 20 * 1024 * 1024,
});

/*
 * =========================================
 * Option Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

function getOptionLabel(options, value, fallback = "") {
  return findOption(options, value)?.label || fallback;
}

/*
 * =========================================
 * Project Option Validation
 * =========================================
 */

export function isValidProjectCategory(value) {
  return Boolean(findOption(PROJECT_CATEGORY_OPTIONS, value));
}

export function isValidProjectLifecycleStatus(value) {
  return Boolean(findOption(PROJECT_LIFECYCLE_STATUS_OPTIONS, value));
}

export function isValidProjectOwnership(value) {
  return Boolean(findOption(PROJECT_OWNERSHIP_OPTIONS, value));
}

export function isValidProjectSource(value) {
  return Boolean(findOption(PROJECT_SOURCE_OPTIONS, value));
}

export function isValidProjectRecordStatus(value) {
  return Boolean(findOption(PROJECT_RECORD_STATUS_OPTIONS, value));
}

export function isValidProjectSkillProficiency(value) {
  return Boolean(findOption(PROJECT_SKILL_PROFICIENCY_OPTIONS, value));
}

export function isValidProjectTechnologyCategory(value) {
  return Boolean(findOption(PROJECT_TECHNOLOGY_CATEGORY_OPTIONS, value));
}

export function isValidProjectRecognitionType(value) {
  return Boolean(findOption(PROJECT_RECOGNITION_TYPE_OPTIONS, value));
}

export function isValidProjectAwardPlacement(value) {
  return Boolean(findOption(PROJECT_AWARD_PLACEMENT_OPTIONS, value));
}

export function isValidProjectMediaType(value) {
  return Boolean(findOption(PROJECT_MEDIA_TYPE_OPTIONS, value));
}

export function isValidProjectDocumentType(value) {
  return Boolean(findOption(PROJECT_DOCUMENT_TYPE_OPTIONS, value));
}

/*
 * =========================================
 * Display Labels
 * =========================================
 */

export function getProjectCategoryLabel(value) {
  return getOptionLabel(PROJECT_CATEGORY_OPTIONS, value, "Other");
}

export function getProjectLifecycleStatusLabel(value) {
  return getOptionLabel(PROJECT_LIFECYCLE_STATUS_OPTIONS, value, "Planned");
}

export function getProjectOwnershipLabel(value) {
  return getOptionLabel(PROJECT_OWNERSHIP_OPTIONS, value, "Individual Project");
}

export function getProjectSourceLabel(value) {
  return getOptionLabel(PROJECT_SOURCE_OPTIONS, value, "Manually Added");
}

export function getProjectRecordStatusLabel(value) {
  return getOptionLabel(PROJECT_RECORD_STATUS_OPTIONS, value, "Active");
}

export function getProjectSkillProficiencyLabel(value) {
  return getOptionLabel(PROJECT_SKILL_PROFICIENCY_OPTIONS, value);
}

export function getProjectTechnologyCategoryLabel(value) {
  return getOptionLabel(PROJECT_TECHNOLOGY_CATEGORY_OPTIONS, value);
}

export function getProjectRecognitionTypeLabel(value) {
  return getOptionLabel(PROJECT_RECOGNITION_TYPE_OPTIONS, value);
}

export function getProjectAwardPlacementLabel(value) {
  return getOptionLabel(PROJECT_AWARD_PLACEMENT_OPTIONS, value);
}

export function getProjectMediaTypeLabel(value) {
  return getOptionLabel(PROJECT_MEDIA_TYPE_OPTIONS, value, "Image");
}

export function getProjectDocumentTypeLabel(value) {
  return getOptionLabel(
    PROJECT_DOCUMENT_TYPE_OPTIONS,
    value,
    "Supporting Evidence",
  );
}

/*
 * =========================================
 * File Helpers
 * =========================================
 */

function getFileType(file) {
  return typeof file?.type === "string"
    ? file.type.trim().toLocaleLowerCase()
    : "";
}

function getFileName(file) {
  return typeof file?.name === "string"
    ? file.name.trim().toLocaleLowerCase()
    : "";
}

function hasFileExtension(fileName, extensions) {
  return extensions.some((extension) => fileName.endsWith(extension));
}

/*
 * =========================================
 * Media Validation
 * =========================================
 */

export function isSupportedProjectMedia(file) {
  if (!file || typeof file !== "object") {
    return false;
  }

  const mimeType = getFileType(file);
  const fileName = getFileName(file);

  const supportedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
  ];

  const supportedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".mp4",
    ".webm",
  ];

  return (
    supportedMimeTypes.includes(mimeType) ||
    hasFileExtension(fileName, supportedExtensions)
  );
}

export function isProjectMediaWithinSizeLimit(file) {
  const fileSize = Number(file?.size);

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return false;
  }

  const mimeType = getFileType(file);
  const fileName = getFileName(file);

  const isVideo =
    mimeType.startsWith("video/") ||
    hasFileExtension(fileName, [".mp4", ".webm"]);

  const maximumSize = isVideo
    ? PROJECT_FIELD_LIMITS.maximumVideoBytes
    : PROJECT_FIELD_LIMITS.maximumImageBytes;

  return fileSize <= maximumSize;
}

/*
 * =========================================
 * Document Validation
 * =========================================
 */

export function isSupportedProjectDocument(file) {
  if (!file || typeof file !== "object") {
    return false;
  }

  const mimeType = getFileType(file);
  const fileName = getFileName(file);

  const supportedMimeTypes = [
    "application/pdf",

    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/zip",
    "application/x-zip-compressed",

    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const supportedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".zip",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  return (
    supportedMimeTypes.includes(mimeType) ||
    hasFileExtension(fileName, supportedExtensions)
  );
}

export function isProjectDocumentWithinSizeLimit(file) {
  const fileSize = Number(file?.size);

  return (
    Number.isFinite(fileSize) &&
    fileSize > 0 &&
    fileSize <= PROJECT_FIELD_LIMITS.maximumDocumentBytes
  );
}
