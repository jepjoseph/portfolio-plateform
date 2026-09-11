import {
  DEFAULT_EDUCATION_VALUES,
  EDUCATION_FIELD_LIMITS,
  isValidEducationCredentialType,
  isValidEducationInstitutionType,
  isValidEducationSource,
  isValidEducationStatus,
} from "../config/educationConfig.js";

import {
  DOCUMENT_FILE_LIMITS,
  isValidDocumentVisibility,
  isValidEducationDocumentType,
} from "../config/documentConfig.js";

/*
 * =========================================
 * Model Version
 * =========================================
 */

export const EDUCATION_MODEL_VERSION = 1;

/*
 * =========================================
 * ID Creation
 * =========================================
 */

export function createEducationId(prefix = "education") {
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
 * Primitive Normalization
 * =========================================
 */

function normalizeText(value, maximumLength = Infinity) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

function normalizeBoolean(value, defaultValue = false) {
  return typeof value === "boolean" ? value : defaultValue;
}

function normalizeNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Number(Math.max(0, numberValue).toFixed(2));
}

function normalizeDate(value) {
  const text = normalizeText(value, 10);

  if (!text) {
    return "";
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/.test(text)) {
    return "";
  }

  return text;
}

function normalizeIdentifierList(values, maximumItems) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) => {
          if (typeof value === "string") {
            return value.trim();
          }

          return String(value?.id || "").trim();
        })
        .filter(Boolean),
    ),
  ].slice(0, maximumItems);
}

/*
 * =========================================
 * Ordered Item Helpers
 * =========================================
 */

function normalizeOrderedItems(values, createItem, maximumItems) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createItem)
    .filter((item) => item.name)
    .slice(0, maximumItems)
    .map((item, index) => ({
      ...item,
      order: index,
    }));
}

/*
 * =========================================
 * Honor Model
 * =========================================
 */

export function createEducationHonor(value = {}) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id: normalizeText(source.id, 200) || createEducationId("education-honor"),

    name: normalizeText(
      source.name || source.title || source.label || source.value,
      EDUCATION_FIELD_LIMITS.honorName,
    ),

    description: normalizeText(
      source.description,
      EDUCATION_FIELD_LIMITS.honorDescription,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeEducationHonors(values) {
  return normalizeOrderedItems(
    values,
    createEducationHonor,
    EDUCATION_FIELD_LIMITS.maximumHonors,
  );
}

/*
 * =========================================
 * Coursework Model
 * =========================================
 */

export function createEducationCoursework(value = {}) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id:
      normalizeText(source.id, 200) ||
      createEducationId("education-coursework"),

    name: normalizeText(
      source.name || source.title || source.label || source.value,
      EDUCATION_FIELD_LIMITS.courseworkName,
    ),

    description: normalizeText(
      source.description,
      EDUCATION_FIELD_LIMITS.courseworkDescription,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeEducationCoursework(values) {
  return normalizeOrderedItems(
    values,
    createEducationCoursework,
    EDUCATION_FIELD_LIMITS.maximumCoursework,
  );
}

/*
 * =========================================
 * Activity Model
 * =========================================
 */

export function createEducationActivity(value = {}) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id:
      normalizeText(source.id, 200) || createEducationId("education-activity"),

    name: normalizeText(
      source.name || source.title || source.label || source.value,
      EDUCATION_FIELD_LIMITS.activityName,
    ),

    description: normalizeText(
      source.description,
      EDUCATION_FIELD_LIMITS.activityDescription,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeEducationActivities(values) {
  return normalizeOrderedItems(
    values,
    createEducationActivity,
    EDUCATION_FIELD_LIMITS.maximumActivities,
  );
}

/*
 * =========================================
 * Skill Relationship Model
 * =========================================
 */

export function createEducationSkill(value = {}) {
  const source =
    typeof value === "string"
      ? {
          nameSnapshot: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id: normalizeText(source.id, 200) || createEducationId("education-skill"),

    /*
     * Permanent relationship to the central
     * Skill Library.
     */

    skillId: normalizeText(source.skillId || source.profileSkillId, 200),

    /*
     * Snapshots preserve readable information when
     * a central skill is archived or unavailable.
     */

    nameSnapshot: normalizeText(
      source.nameSnapshot || source.name || source.label || source.value,
      EDUCATION_FIELD_LIMITS.skillName,
    ),

    categorySnapshot: normalizeText(
      source.categorySnapshot || source.category,
      EDUCATION_FIELD_LIMITS.skillCategory,
    ),

    typeSnapshot: normalizeText(
      source.typeSnapshot || source.type,
      EDUCATION_FIELD_LIMITS.skillType,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeEducationSkills(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedSkills = values
    .map(createEducationSkill)
    .filter(
      (relationship) => relationship.skillId || relationship.nameSnapshot,
    );

  const uniqueSkills = normalizedSkills.filter(
    (relationship, index, collection) => {
      const identity = (relationship.skillId || relationship.nameSnapshot)
        .normalize("NFKC")
        .trim()
        .toLocaleLowerCase();

      return (
        collection.findIndex((candidate) => {
          const candidateIdentity = (
            candidate.skillId || candidate.nameSnapshot
          )
            .normalize("NFKC")
            .trim()
            .toLocaleLowerCase();

          return candidateIdentity === identity;
        }) === index
      );
    },
  );

  return uniqueSkills
    .slice(0, EDUCATION_FIELD_LIMITS.maximumSkills)
    .map((relationship, index) => ({
      ...relationship,
      order: index,
    }));
}

/*
 * =========================================
 * Supporting Document Model
 * =========================================
 */

export function createEducationDocument(value = {}) {
  const source = value && typeof value === "object" ? value : {};

  const documentType = isValidEducationDocumentType(source.documentType)
    ? source.documentType
    : "other";

  const visibility = isValidDocumentVisibility(source.visibility)
    ? source.visibility
    : "private";

  return {
    id:
      normalizeText(source.id, 200) || createEducationId("education-document"),

    documentType,

    name: normalizeText(
      source.name || source.title || source.fileName,
      DOCUMENT_FILE_LIMITS.documentName,
    ),

    description: normalizeText(
      source.description,
      DOCUMENT_FILE_LIMITS.description,
    ),

    fileName: normalizeText(source.fileName, DOCUMENT_FILE_LIMITS.fileName),

    mimeType: normalizeText(source.mimeType || source.fileType, 200),

    fileSize: normalizeNullableNumber(source.fileSize) || 0,

    storageProvider: normalizeText(source.storageProvider, 50) || "indexed-db",

    storageKey: normalizeText(
      source.storageKey,
      DOCUMENT_FILE_LIMITS.storageKey,
    ),

    fileUrl: normalizeText(source.fileUrl, DOCUMENT_FILE_LIMITS.fileUrl),

    uploadedAt:
      normalizeText(source.uploadedAt, 100) || new Date().toISOString(),

    visibility,

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeEducationDocuments(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createEducationDocument)
    .filter(
      (document) => document.name && (document.storageKey || document.fileUrl),
    )
    .slice(0, DOCUMENT_FILE_LIMITS.maximumDocumentsPerRecord)
    .filter(
      (document, index, collection) =>
        collection.findIndex((candidate) => candidate.id === document.id) ===
        index,
    )
    .map((document, index) => ({
      ...document,
      order: index,
    }));
}

/*
 * =========================================
 * Empty Education
 * =========================================
 */

export function createEmptyEducation() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: EDUCATION_MODEL_VERSION,

    id: createEducationId(),

    institution: {
      name: "",
      website: "",
      type: DEFAULT_EDUCATION_VALUES.institutionType,
    },

    credential: {
      type: DEFAULT_EDUCATION_VALUES.credentialType,

      name: "",

      fieldOfStudy: "",

      minor: "",
    },

    location: {
      city: "",
      stateRegion: "",
      country: "",
      displayValue: "",
    },

    dates: {
      startDate: "",
      endDate: "",
      isCurrent: false,
    },

    academic: {
      gpa: null,
      maximumGpa: null,
      honors: [],
    },

    description: "",

    coursework: [],

    activities: [],

    skillRelationships: [],

    supportingDocuments: [],

    /*
     * These relationship collections are present
     * now so future selectors do not require a
     * model-version change.
     */

    relatedCertificationIds: [],

    relatedTrainingIds: [],

    relatedProjectIds: [],

    visibility: {
      showInstitutionWebsite: true,
      showLocation: true,
      showGpa: false,
      showHonors: true,
      showCoursework: true,
      showActivities: true,
      showSkills: true,
    },

    privateInformation: {
      notes: "",
    },

    source: DEFAULT_EDUCATION_VALUES.source,

    sourceContext: "",

    status: DEFAULT_EDUCATION_VALUES.status,

    createdAt: timestamp,

    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Education Normalization
 * =========================================
 */

export function normalizeEducation(value = {}) {
  const defaults = createEmptyEducation();

  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const institution =
    source.institution && typeof source.institution === "object"
      ? source.institution
      : {};

  const credential =
    source.credential && typeof source.credential === "object"
      ? source.credential
      : {};

  const location =
    source.location && typeof source.location === "object"
      ? source.location
      : {};

  const dates =
    source.dates && typeof source.dates === "object" ? source.dates : {};

  const academic =
    source.academic && typeof source.academic === "object"
      ? source.academic
      : {};

  const visibility =
    source.visibility && typeof source.visibility === "object"
      ? source.visibility
      : {};

  const privateInformation =
    source.privateInformation && typeof source.privateInformation === "object"
      ? source.privateInformation
      : {};

  const credentialType = isValidEducationCredentialType(
    credential.type || source.credentialType || source.degreeType,
  )
    ? credential.type || source.credentialType || source.degreeType
    : defaults.credential.type;

  const institutionType = isValidEducationInstitutionType(
    institution.type || source.institutionType || "",
  )
    ? institution.type || source.institutionType || ""
    : defaults.institution.type;

  const educationSource = isValidEducationSource(source.source)
    ? source.source
    : defaults.source;

  const status = isValidEducationStatus(source.status)
    ? source.status
    : defaults.status;

  const isCurrent = normalizeBoolean(dates.isCurrent, false);

  const gpa = normalizeNullableNumber(academic.gpa ?? source.gpa);

  const maximumGpa = normalizeNullableNumber(
    academic.maximumGpa ?? source.maximumGpa,
  );

  return {
    modelVersion: EDUCATION_MODEL_VERSION,

    id: normalizeText(source.id, 200) || defaults.id,

    institution: {
      name: normalizeText(
        institution.name ||
          source.institutionName ||
          source.schoolName ||
          source.school,
        EDUCATION_FIELD_LIMITS.institutionName,
      ),

      website: normalizeText(
        institution.website || source.institutionWebsite,
        EDUCATION_FIELD_LIMITS.institutionWebsite,
      ),

      type: institutionType,
    },

    credential: {
      type: credentialType,

      name: normalizeText(
        credential.name ||
          source.credentialName ||
          source.degreeName ||
          source.degree,
        EDUCATION_FIELD_LIMITS.credentialName,
      ),

      fieldOfStudy: normalizeText(
        credential.fieldOfStudy || source.fieldOfStudy || source.major,
        EDUCATION_FIELD_LIMITS.fieldOfStudy,
      ),

      minor: normalizeText(
        credential.minor || source.minor,
        EDUCATION_FIELD_LIMITS.minor,
      ),
    },

    location: {
      city: normalizeText(location.city, EDUCATION_FIELD_LIMITS.city),

      stateRegion: normalizeText(
        location.stateRegion || location.state,
        EDUCATION_FIELD_LIMITS.stateRegion,
      ),

      country: normalizeText(location.country, EDUCATION_FIELD_LIMITS.country),

      displayValue: normalizeText(
        location.displayValue ||
          source.locationValue ||
          (typeof source.location === "string" ? source.location : ""),
        EDUCATION_FIELD_LIMITS.locationDisplayValue,
      ),
    },

    dates: {
      startDate: normalizeDate(dates.startDate || source.startDate),

      endDate: isCurrent ? "" : normalizeDate(dates.endDate || source.endDate),

      isCurrent,
    },

    academic: {
      gpa,

      maximumGpa,

      honors: normalizeEducationHonors(academic.honors || source.honors),
    },

    description: normalizeText(
      source.description || source.overview,
      EDUCATION_FIELD_LIMITS.description,
    ),

    coursework: normalizeEducationCoursework(
      source.coursework || source.relevantCoursework,
    ),

    activities: normalizeEducationActivities(
      source.activities || source.organizations,
    ),

    skillRelationships: normalizeEducationSkills(
      source.skillRelationships || source.skills,
    ),

    supportingDocuments: normalizeEducationDocuments(
      source.supportingDocuments || source.documents || source.attachments,
    ),

    relatedCertificationIds: normalizeIdentifierList(
      source.relatedCertificationIds || source.certificationIds,
      EDUCATION_FIELD_LIMITS.maximumRelatedCertifications,
    ),

    relatedTrainingIds: normalizeIdentifierList(
      source.relatedTrainingIds || source.trainingIds,
      EDUCATION_FIELD_LIMITS.maximumRelatedTraining,
    ),

    relatedProjectIds: normalizeIdentifierList(
      source.relatedProjectIds || source.projectIds,
      EDUCATION_FIELD_LIMITS.maximumRelatedProjects,
    ),

    visibility: {
      showInstitutionWebsite: normalizeBoolean(
        visibility.showInstitutionWebsite,
        defaults.visibility.showInstitutionWebsite,
      ),

      showLocation: normalizeBoolean(
        visibility.showLocation,
        defaults.visibility.showLocation,
      ),

      showGpa: normalizeBoolean(
        visibility.showGpa,
        defaults.visibility.showGpa,
      ),

      showHonors: normalizeBoolean(
        visibility.showHonors,
        defaults.visibility.showHonors,
      ),

      showCoursework: normalizeBoolean(
        visibility.showCoursework,
        defaults.visibility.showCoursework,
      ),

      showActivities: normalizeBoolean(
        visibility.showActivities,
        defaults.visibility.showActivities,
      ),

      showSkills: normalizeBoolean(
        visibility.showSkills,
        defaults.visibility.showSkills,
      ),
    },

    privateInformation: {
      notes: normalizeText(
        privateInformation.notes || source.privateNotes,
        EDUCATION_FIELD_LIMITS.privateNotes,
      ),
    },

    source: educationSource,

    sourceContext: normalizeText(
      source.sourceContext,
      EDUCATION_FIELD_LIMITS.sourceContext,
    ),

    status,

    createdAt: normalizeText(source.createdAt, 100) || defaults.createdAt,

    updatedAt: normalizeText(source.updatedAt, 100) || defaults.updatedAt,
  };
}

/*
 * =========================================
 * Create Education
 * =========================================
 */

export function createEducation(values = {}) {
  const timestamp = new Date().toISOString();

  return normalizeEducation({
    ...values,

    id: normalizeText(values?.id, 200) || createEducationId(),

    createdAt: normalizeText(values?.createdAt, 100) || timestamp,

    updatedAt: timestamp,
  });
}

/*
 * =========================================
 * Update Education
 * =========================================
 */

export function updateEducationModel(currentEducation, updates = {}) {
  const safeUpdates = updates && typeof updates === "object" ? updates : {};

  return normalizeEducation({
    ...currentEducation,
    ...safeUpdates,

    institution: {
      ...currentEducation?.institution,
      ...safeUpdates.institution,
    },

    credential: {
      ...currentEducation?.credential,
      ...safeUpdates.credential,
    },

    location: {
      ...currentEducation?.location,
      ...safeUpdates.location,
    },

    dates: {
      ...currentEducation?.dates,
      ...safeUpdates.dates,
    },

    academic: {
      ...currentEducation?.academic,
      ...safeUpdates.academic,

      honors:
        safeUpdates.academic?.honors ?? currentEducation?.academic?.honors,
    },

    visibility: {
      ...currentEducation?.visibility,
      ...safeUpdates.visibility,
    },

    privateInformation: {
      ...currentEducation?.privateInformation,
      ...safeUpdates.privateInformation,
    },

    id: currentEducation?.id,

    createdAt: currentEducation?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Collection Normalization
 * =========================================
 */

export function normalizeEducationCollection(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedRecords = values.map(normalizeEducation);

  return normalizedRecords.filter(
    (education, index, collection) =>
      collection.findIndex((candidate) => candidate.id === education.id) ===
      index,
  );
}

/*
 * =========================================
 * Public Education
 * =========================================
 */

export function createPublicEducation(value) {
  const education = normalizeEducation(value);

  const { privateInformation, sourceContext, ...publicEducation } = education;

  return publicEducation;
}
