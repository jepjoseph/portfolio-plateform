/*
 * =========================================
 * Training Types
 * =========================================
 */

export const TRAINING_TYPE_OPTIONS = [
  {
    value: "professional-course",
    label: "Professional Course",
    description: "A structured professional-development course.",
  },
  {
    value: "technical-training",
    label: "Technical Training",
    description: "Hands-on technical or technology-focused training.",
  },
  {
    value: "workshop",
    label: "Workshop",
    description: "A practical, interactive learning session.",
  },
  {
    value: "bootcamp",
    label: "Bootcamp",
    description: "An intensive skills-development program.",
  },
  {
    value: "seminar",
    label: "Seminar",
    description: "A focused educational or professional seminar.",
  },
  {
    value: "webinar",
    label: "Webinar",
    description: "An online educational presentation or session.",
  },
  {
    value: "conference",
    label: "Conference",
    description: "A professional or academic conference program.",
  },
  {
    value: "employer-training",
    label: "Employer Training",
    description: "Training provided through an employer.",
  },
  {
    value: "vendor-training",
    label: "Vendor Training",
    description: "Product or technology training provided by a vendor.",
  },
  {
    value: "compliance-training",
    label: "Compliance Training",
    description: "Required policy, safety, regulatory, or compliance training.",
  },
  {
    value: "leadership-training",
    label: "Leadership Training",
    description: "Training focused on leadership or management.",
  },
  {
    value: "self-paced-learning",
    label: "Self-Paced Learning",
    description: "Independent training completed at the learner's own pace.",
  },
  {
    value: "other",
    label: "Other Training",
    description: "Another type of structured learning or training.",
  },
];

/*
 * =========================================
 * Providers
 * =========================================
 */

export const TRAINING_PROVIDER_TYPE_OPTIONS = [
  {
    value: "",
    label: "Not specified",
  },
  {
    value: "education-institution",
    label: "Education Institution",
  },
  {
    value: "employer",
    label: "Employer",
  },
  {
    value: "technology-vendor",
    label: "Technology Vendor",
  },
  {
    value: "training-company",
    label: "Training Company",
  },
  {
    value: "professional-association",
    label: "Professional Association",
  },
  {
    value: "government",
    label: "Government Organization",
  },
  {
    value: "nonprofit",
    label: "Nonprofit Organization",
  },
  {
    value: "online-platform",
    label: "Online Learning Platform",
  },
  {
    value: "independent-instructor",
    label: "Independent Instructor",
  },
  {
    value: "self-directed",
    label: "Self-Directed",
  },
  {
    value: "other",
    label: "Other Provider",
  },
];

/*
 * =========================================
 * Delivery Formats
 * =========================================
 */

export const TRAINING_DELIVERY_FORMAT_OPTIONS = [
  {
    value: "in-person",
    label: "In Person",
  },
  {
    value: "online-live",
    label: "Online — Live",
  },
  {
    value: "online-self-paced",
    label: "Online — Self-Paced",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
  {
    value: "on-the-job",
    label: "On the Job",
  },
  {
    value: "other",
    label: "Other Format",
  },
];

/*
 * =========================================
 * Completion Status
 * =========================================
 */

export const TRAINING_COMPLETION_STATUS_OPTIONS = [
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
    value: "paused",
    label: "Paused",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
  },
];

/*
 * =========================================
 * Supporting Document Types
 * =========================================
 */

export const TRAINING_DOCUMENT_TYPE_OPTIONS = [
  {
    value: "completion-certificate",
    label: "Completion Certificate",
  },
  {
    value: "attendance-certificate",
    label: "Attendance Certificate",
  },
  {
    value: "transcript",
    label: "Training Transcript",
  },
  {
    value: "course-outline",
    label: "Course Outline",
  },
  {
    value: "syllabus",
    label: "Syllabus",
  },
  {
    value: "assessment",
    label: "Assessment or Evaluation",
  },
  {
    value: "badge",
    label: "Digital Badge",
  },
  {
    value: "receipt",
    label: "Receipt",
  },
  {
    value: "supporting-evidence",
    label: "Supporting Evidence",
  },
  {
    value: "other",
    label: "Other Document",
  },
];

/*
 * =========================================
 * Sources
 * =========================================
 */

export const TRAINING_SOURCE_OPTIONS = [
  {
    value: "manual",
    label: "Manually Added",
  },
  {
    value: "imported",
    label: "Imported",
  },
  {
    value: "ai-suggested",
    label: "AI Suggested",
  },
];

/*
 * =========================================
 * Record Status
 * =========================================
 */

export const TRAINING_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    description: "Available for résumés, portfolios, and related records.",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Preserved but hidden from normal selection.",
  },
];

/*
 * =========================================
 * Field Limits
 * =========================================
 */

export const TRAINING_FIELD_LIMITS = {
  title: 250,

  providerName: 200,
  providerWebsite: 500,

  description: 3000,

  city: 120,
  stateRegion: 120,
  country: 120,
  locationDisplayValue: 300,

  instructorName: 200,
  instructorTitle: 200,
  instructorOrganization: 200,

  topicName: 250,
  topicDescription: 1500,

  outcomeText: 1500,

  skillName: 150,
  skillCategory: 100,
  skillType: 100,

  credentialId: 250,
  credentialUrl: 1000,

  privateNotes: 3000,
  sourceContext: 500,

  maximumInstructors: 20,
  maximumTopics: 50,
  maximumLearningOutcomes: 30,
  maximumSkills: 50,
  maximumDocuments: 20,

  maximumRelatedEducation: 20,
  maximumRelatedCertifications: 20,
  maximumRelatedExperiences: 30,
  maximumRelatedProjects: 30,

  maximumDurationHours: 100000,
};

/*
 * =========================================
 * Required Fields
 * =========================================
 */

export const TRAINING_REQUIRED_FIELDS = [
  "title",
  "provider.name",
  "trainingType",
  "dates.startDate",
  "completion.status",
];

/*
 * =========================================
 * Form Sections
 * =========================================
 */

export const TRAINING_FORM_SECTIONS = [
  {
    id: "program",
    number: "01",
    label: "Program",
    title: "Training Program",
    description: "Enter the training title, type, and provider.",
  },
  {
    id: "timeline-delivery",
    number: "02",
    label: "Timeline",
    title: "Dates and Delivery",
    description: "Describe when, where, and how the training was delivered.",
  },
  {
    id: "completion",
    number: "03",
    label: "Completion",
    title: "Completion and Credential",
    description:
      "Record completion status, duration, credential, and verification details.",
  },
  {
    id: "description",
    number: "04",
    label: "Overview",
    title: "Training Description",
    description: "Explain the purpose and scope of the training.",
  },
  {
    id: "topics",
    number: "05",
    label: "Topics",
    title: "Topics and Curriculum",
    description: "Record the subjects and curriculum covered.",
  },
  {
    id: "outcomes",
    number: "06",
    label: "Outcomes",
    title: "Learning Outcomes",
    description: "Describe the knowledge and capabilities developed.",
  },
  {
    id: "skills",
    number: "07",
    label: "Skills",
    title: "Related Skills",
    description: "Connect the training to the central Skill Library.",
  },
  {
    id: "documents",
    number: "08",
    label: "Documents",
    title: "Supporting Documents",
    description: "Attach certificates, outlines, assessments, and evidence.",
  },
  {
    id: "settings",
    number: "09",
    label: "Management",
    title: "Record Settings",
    description: "Manage visibility, relationships, source, and private notes.",
  },
];

/*
 * =========================================
 * Option Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getTrainingTypeOption(value) {
  return findOption(TRAINING_TYPE_OPTIONS, value);
}

export function getTrainingTypeLabel(value) {
  return getTrainingTypeOption(value)?.label || "";
}

export function getTrainingProviderTypeOption(value) {
  return findOption(TRAINING_PROVIDER_TYPE_OPTIONS, value);
}

export function getTrainingProviderTypeLabel(value) {
  return getTrainingProviderTypeOption(value)?.label || "";
}

export function getTrainingDeliveryFormatOption(value) {
  return findOption(TRAINING_DELIVERY_FORMAT_OPTIONS, value);
}

export function getTrainingDeliveryFormatLabel(value) {
  return getTrainingDeliveryFormatOption(value)?.label || "";
}

export function getTrainingCompletionStatusOption(value) {
  return findOption(TRAINING_COMPLETION_STATUS_OPTIONS, value);
}

export function getTrainingCompletionStatusLabel(value) {
  return getTrainingCompletionStatusOption(value)?.label || "";
}

export function getTrainingDocumentTypeOption(value) {
  return findOption(TRAINING_DOCUMENT_TYPE_OPTIONS, value);
}

export function getTrainingDocumentTypeLabel(value) {
  return getTrainingDocumentTypeOption(value)?.label || "";
}

export function getTrainingSourceOption(value) {
  return findOption(TRAINING_SOURCE_OPTIONS, value);
}

export function getTrainingSourceLabel(value) {
  return getTrainingSourceOption(value)?.label || "";
}

export function getTrainingStatusOption(value) {
  return findOption(TRAINING_STATUS_OPTIONS, value);
}

export function getTrainingStatusLabel(value) {
  return getTrainingStatusOption(value)?.label || "";
}

/*
 * =========================================
 * Option Validation
 * =========================================
 */

export function isValidTrainingType(value) {
  return Boolean(getTrainingTypeOption(value));
}

export function isValidTrainingProviderType(value) {
  return Boolean(getTrainingProviderTypeOption(value));
}

export function isValidTrainingDeliveryFormat(value) {
  return Boolean(getTrainingDeliveryFormatOption(value));
}

export function isValidTrainingCompletionStatus(value) {
  return Boolean(getTrainingCompletionStatusOption(value));
}

export function isValidTrainingDocumentType(value) {
  return Boolean(getTrainingDocumentTypeOption(value));
}

export function isValidTrainingSource(value) {
  return Boolean(getTrainingSourceOption(value));
}

export function isValidTrainingStatus(value) {
  return Boolean(getTrainingStatusOption(value));
}