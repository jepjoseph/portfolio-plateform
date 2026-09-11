import { EDUCATION_DOCUMENT_TYPE_OPTIONS } from "./documentConfig.js";

/*
 * =========================================
 * Credential Types
 * =========================================
 */

export const EDUCATION_CREDENTIAL_TYPE_OPTIONS = [
  {
    value: "high-school",
    label: "High School Diploma",
    description: "A secondary-school diploma or equivalent credential.",
  },
  {
    value: "ged",
    label: "GED or Equivalent",
    description: "A high-school equivalency credential.",
  },
  {
    value: "associate",
    label: "Associate Degree",
    description: "An undergraduate associate-level degree.",
  },
  {
    value: "bachelors",
    label: "Bachelor’s Degree",
    description: "An undergraduate bachelor-level degree.",
  },
  {
    value: "masters",
    label: "Master’s Degree",
    description: "A graduate master-level degree.",
  },
  {
    value: "doctorate",
    label: "Doctoral Degree",
    description: "A doctoral or research-focused graduate degree.",
  },
  {
    value: "professional-degree",
    label: "Professional Degree",
    description:
      "A degree preparing for a regulated or specialized profession.",
  },
  {
    value: "diploma",
    label: "Diploma",
    description: "An academic, technical, or professional diploma.",
  },
  {
    value: "certificate",
    label: "Academic Certificate",
    description: "A certificate awarded by an educational institution.",
  },
  {
    value: "vocational",
    label: "Vocational Qualification",
    description: "A vocational, trade, or technical qualification.",
  },
  {
    value: "bootcamp",
    label: "Bootcamp",
    description: "An intensive career or technical education program.",
  },
  {
    value: "coursework",
    label: "Coursework Only",
    description:
      "College or university coursework without a completed credential.",
  },
  {
    value: "other",
    label: "Other Education",
    description: "Another relevant educational credential or program.",
  },
];

/*
 * =========================================
 * Institution Types
 * =========================================
 */

export const EDUCATION_INSTITUTION_TYPE_OPTIONS = [
  {
    value: "",
    label: "Not specified",
  },
  {
    value: "university",
    label: "University",
  },
  {
    value: "college",
    label: "College",
  },
  {
    value: "community-college",
    label: "Community College",
  },
  {
    value: "technical-school",
    label: "Technical School",
  },
  {
    value: "vocational-school",
    label: "Vocational School",
  },
  {
    value: "high-school",
    label: "High School",
  },
  {
    value: "online-institution",
    label: "Online Institution",
  },
  {
    value: "training-provider",
    label: "Training Provider",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
 * =========================================
 * Education Sources
 * =========================================
 */

export const EDUCATION_SOURCE_OPTIONS = [
  {
    value: "manual",
    label: "Added Manually",
  },
  {
    value: "imported",
    label: "Imported",
  },
  {
    value: "migration",
    label: "Migrated",
  },
];

/*
 * =========================================
 * Record Status
 * =========================================
 */

export const EDUCATION_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    description: "Available for Résumé, Portfolio, and Project selection.",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Preserved but unavailable in normal selection lists.",
  },
];

/*
 * =========================================
 * Field Limits
 * =========================================
 */

export const EDUCATION_FIELD_LIMITS = {
  institutionName: 200,
  institutionWebsite: 500,
  institutionType: 100,

  credentialName: 250,
  fieldOfStudy: 200,
  minor: 200,

  city: 120,
  stateRegion: 120,
  country: 120,
  locationDisplayValue: 300,

  description: 3000,

  honorName: 250,
  honorDescription: 1000,

  courseworkName: 250,
  courseworkDescription: 1000,

  activityName: 250,
  activityDescription: 1000,

  skillName: 150,
  skillCategory: 100,
  skillType: 100,

  privateNotes: 3000,
  sourceContext: 100,

  maximumHonors: 30,
  maximumCoursework: 50,
  maximumActivities: 30,
  maximumSkills: 50,

  maximumRelatedCertifications: 30,
  maximumRelatedTraining: 30,
  maximumRelatedProjects: 50,

  documentName: 250,
  documentDescription: 1000,
  maximumSupportingDocuments: 20,
};

/*
 * =========================================
 * Required Fields
 * =========================================
 */

export const EDUCATION_REQUIRED_FIELDS = [
  "institution.name",
  "credential.type",
  "credential.name",
  "dates.startDate",
];

/*
 * =========================================
 * Default Values
 * =========================================
 */

export const DEFAULT_EDUCATION_VALUES = {
  credentialType: "bachelors",
  institutionType: "",
  source: "manual",
  status: "active",
};

/*
 * =========================================
 * Form Sections
 * =========================================
 */

export const EDUCATION_FORM_SECTIONS = [
  {
    id: "institution",
    number: "01",
    label: "Institution",
    title: "Institution Information",
    description:
      "Enter the school, college, university, or educational provider.",
  },
  {
    id: "credential",
    number: "02",
    label: "Credential",
    title: "Degree and Field of Study",
    description: "Describe the credential, program, major, and minor.",
  },
  {
    id: "timeline-location",
    number: "03",
    label: "Timeline",
    title: "Dates and Location",
    description: "Record when and where the education occurred.",
  },
  {
    id: "academic",
    number: "04",
    label: "Academic",
    title: "Academic Information",
    description: "Add GPA information and academic honors when appropriate.",
  },
  {
    id: "coursework",
    number: "05",
    label: "Coursework",
    title: "Relevant Coursework",
    description:
      "Record courses that support your professional qualifications.",
  },
  {
    id: "activities",
    number: "06",
    label: "Activities",
    title: "Activities and Organizations",
    description:
      "Add academic organizations, leadership, research, or other activities.",
  },
  {
    id: "skills",
    number: "07",
    label: "Skills",
    title: "Skills Developed",
    description:
      "Connect skills from the central Skill Library to this education record.",
  },
  {
    id: "settings",
    number: "08",
    label: "Management",
    title: "Record Settings",
    description:
      "Manage visibility, private notes, source information, and status.",
  },
];

export { EDUCATION_DOCUMENT_TYPE_OPTIONS };

/*
 * =========================================
 * Option Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getEducationCredentialTypeOption(value) {
  return findOption(EDUCATION_CREDENTIAL_TYPE_OPTIONS, value);
}

export function getEducationCredentialTypeLabel(value) {
  return getEducationCredentialTypeOption(value)?.label || "Other Education";
}

export function getEducationInstitutionTypeOption(value) {
  return findOption(EDUCATION_INSTITUTION_TYPE_OPTIONS, value);
}

export function getEducationInstitutionTypeLabel(value) {
  return getEducationInstitutionTypeOption(value)?.label || "Not specified";
}

export function getEducationSourceOption(value) {
  return findOption(EDUCATION_SOURCE_OPTIONS, value);
}

export function getEducationSourceLabel(value) {
  return getEducationSourceOption(value)?.label || "Added Manually";
}

export function getEducationStatusOption(value) {
  return findOption(EDUCATION_STATUS_OPTIONS, value);
}

export function getEducationStatusLabel(value) {
  return getEducationStatusOption(value)?.label || "Active";
}

/*
 * =========================================
 * Option Validation
 * =========================================
 */

export function isValidEducationCredentialType(value) {
  return Boolean(getEducationCredentialTypeOption(value));
}

export function isValidEducationInstitutionType(value) {
  return Boolean(getEducationInstitutionTypeOption(value));
}

export function isValidEducationSource(value) {
  return Boolean(getEducationSourceOption(value));
}

export function isValidEducationStatus(value) {
  return Boolean(getEducationStatusOption(value));
}
