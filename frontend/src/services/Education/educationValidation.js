import {
  EDUCATION_FIELD_LIMITS,
  isValidEducationCredentialType,
  isValidEducationInstitutionType,
  isValidEducationSource,
  isValidEducationStatus,
} from "../../config/educationConfig.js";

import {
  DOCUMENT_FILE_LIMITS,
  isValidDocumentVisibility,
  isValidEducationDocumentType,
} from "../../config/documentConfig.js";

/*
 * =========================================
 * Basic Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function createIssue(field, message, code = "invalid") {
  return {
    field,
    message,
    code,
  };
}

/*
 * =========================================
 * Validation Collector
 * =========================================
 */

function createValidationCollector() {
  const errors = [];
  const warnings = [];

  return {
    errors,
    warnings,

    addError(field, message, code) {
      errors.push(createIssue(field, message, code));
    },

    addWarning(field, message, code = "warning") {
      warnings.push(createIssue(field, message, code));
    },
  };
}

/*
 * =========================================
 * Generic Validation
 * =========================================
 */

function validateTextLength(collector, field, value, maximumLength, label) {
  if (typeof value !== "string") {
    return;
  }

  if (value.trim().length > maximumLength) {
    collector.addError(
      field,
      `${label} cannot exceed ${maximumLength} characters.`,
      "too_long",
    );
  }
}

function findDuplicateIndexes(values, getIdentity) {
  const seen = new Map();
  const duplicates = [];

  values.forEach((value, index) => {
    const identity = getText(getIdentity(value)).toLocaleLowerCase();

    if (!identity) {
      return;
    }

    if (seen.has(identity)) {
      duplicates.push({
        firstIndex: seen.get(identity),
        duplicateIndex: index,
      });

      return;
    }

    seen.set(identity, index);
  });

  return duplicates;
}

function validateOrder(collector, field, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!Number.isInteger(value) || value < 0) {
    collector.addError(
      field,
      "Item order must be a whole number of zero or greater.",
      "invalid_order",
    );
  }
}

/*
 * =========================================
 * Date Validation
 * =========================================
 */

const EDUCATION_DATE_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/;

function isValidEducationDate(value) {
  const text = getText(value);

  if (!text || !EDUCATION_DATE_PATTERN.test(text)) {
    return false;
  }

  if (text.length === 7) {
    return true;
  }

  const [year, month, day] = text.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getComparableDate(value, useEndOfMonth = false) {
  if (!isValidEducationDate(value)) {
    return null;
  }

  const [year, month, suppliedDay] = getText(value).split("-").map(Number);

  let day = suppliedDay;

  if (!day) {
    day = useEndOfMonth ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 1;
  }

  return Date.UTC(year, month - 1, day);
}

/*
 * =========================================
 * Website Validation
 * =========================================
 */

function isValidWebsite(value) {
  const text = getText(value);

  if (!text) {
    return true;
  }

  try {
    const normalizedUrl = /^https?:\/\//i.test(text) ? text : `https://${text}`;

    const url = new URL(normalizedUrl);

    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/*
 * =========================================
 * Required Information
 * =========================================
 */

function validateRequiredInformation(collector, education) {
  const institution = getObject(education.institution);

  const credential = getObject(education.credential);

  const dates = getObject(education.dates);

  if (!getText(institution.name)) {
    collector.addError(
      "institution.name",
      "Enter the institution or education provider name.",
      "required",
    );
  }

  if (!getText(credential.type)) {
    collector.addError(
      "credential.type",
      "Select a credential type.",
      "required",
    );
  }

  if (!getText(credential.name)) {
    collector.addError(
      "credential.name",
      "Enter the degree, diploma, certificate, or program name.",
      "required",
    );
  }

  if (!getText(dates.startDate)) {
    collector.addError(
      "dates.startDate",
      "Enter the education start date.",
      "required",
    );
  }
}

/*
 * =========================================
 * Configured Options
 * =========================================
 */

function validateConfiguredOptions(collector, education) {
  const institution = getObject(education.institution);

  const credential = getObject(education.credential);

  if (!isValidEducationCredentialType(credential.type)) {
    collector.addError(
      "credential.type",
      "Select a valid credential type.",
      "invalid_option",
    );
  }

  if (!isValidEducationInstitutionType(institution.type ?? "")) {
    collector.addError(
      "institution.type",
      "Select a valid institution type.",
      "invalid_option",
    );
  }

  if (!isValidEducationSource(education.source)) {
    collector.addError(
      "source",
      "Select a valid education source.",
      "invalid_option",
    );
  }

  if (!isValidEducationStatus(education.status)) {
    collector.addError(
      "status",
      "Select a valid education status.",
      "invalid_option",
    );
  }
}

/*
 * =========================================
 * Institution and Credential
 * =========================================
 */

function validateInstitutionAndCredential(collector, education) {
  const institution = getObject(education.institution);

  const credential = getObject(education.credential);

  validateTextLength(
    collector,
    "institution.name",
    institution.name,
    EDUCATION_FIELD_LIMITS.institutionName,
    "Institution name",
  );

  validateTextLength(
    collector,
    "institution.website",
    institution.website,
    EDUCATION_FIELD_LIMITS.institutionWebsite,
    "Institution website",
  );

  if (institution.website && !isValidWebsite(institution.website)) {
    collector.addError(
      "institution.website",
      "Enter a valid institution website.",
      "invalid_url",
    );
  }

  validateTextLength(
    collector,
    "credential.name",
    credential.name,
    EDUCATION_FIELD_LIMITS.credentialName,
    "Credential name",
  );

  validateTextLength(
    collector,
    "credential.fieldOfStudy",
    credential.fieldOfStudy,
    EDUCATION_FIELD_LIMITS.fieldOfStudy,
    "Field of study",
  );

  validateTextLength(
    collector,
    "credential.minor",
    credential.minor,
    EDUCATION_FIELD_LIMITS.minor,
    "Minor",
  );
}

/*
 * =========================================
 * Dates
 * =========================================
 */

function validateDates(collector, education) {
  const dates = getObject(education.dates);

  const startDate = getText(dates.startDate);

  const endDate = getText(dates.endDate);

  const isCurrent = dates.isCurrent === true;

  if (startDate && !isValidEducationDate(startDate)) {
    collector.addError(
      "dates.startDate",
      "Enter a valid start date.",
      "invalid_date",
    );
  }

  if (isCurrent && endDate) {
    collector.addError(
      "dates.endDate",
      "Current education cannot have an end date.",
      "current_education_has_end_date",
    );
  }

  if (!isCurrent && !endDate) {
    collector.addError(
      "dates.endDate",
      "Enter an end date or mark this education as current.",
      "required",
    );
  }

  if (!isCurrent && endDate && !isValidEducationDate(endDate)) {
    collector.addError(
      "dates.endDate",
      "Enter a valid end date.",
      "invalid_date",
    );
  }

  if (
    startDate &&
    endDate &&
    isValidEducationDate(startDate) &&
    isValidEducationDate(endDate)
  ) {
    const comparableStart = getComparableDate(startDate);

    const comparableEnd = getComparableDate(endDate, true);

    if (comparableEnd < comparableStart) {
      collector.addError(
        "dates.endDate",
        "The end date cannot be earlier than the start date.",
        "invalid_date_order",
      );
    }
  }
}

/*
 * =========================================
 * Location
 * =========================================
 */

function validateLocation(collector, education) {
  const location = getObject(education.location);

  validateTextLength(
    collector,
    "location.city",
    location.city,
    EDUCATION_FIELD_LIMITS.city,
    "City",
  );

  validateTextLength(
    collector,
    "location.stateRegion",
    location.stateRegion,
    EDUCATION_FIELD_LIMITS.stateRegion,
    "State or region",
  );

  validateTextLength(
    collector,
    "location.country",
    location.country,
    EDUCATION_FIELD_LIMITS.country,
    "Country",
  );

  validateTextLength(
    collector,
    "location.displayValue",
    location.displayValue,
    EDUCATION_FIELD_LIMITS.locationDisplayValue,
    "Display location",
  );
}

/*
 * =========================================
 * Academic Information
 * =========================================
 */

function validateAcademicInformation(collector, education) {
  const academic = getObject(education.academic);

  const gpa = academic.gpa;
  const maximumGpa = academic.maximumGpa;

  if (gpa !== null && gpa !== undefined && gpa !== "") {
    const numericGpa = Number(gpa);

    if (!Number.isFinite(numericGpa) || numericGpa < 0) {
      collector.addError(
        "academic.gpa",
        "GPA must be zero or greater.",
        "invalid_number",
      );
    }
  }

  if (maximumGpa !== null && maximumGpa !== undefined && maximumGpa !== "") {
    const numericMaximum = Number(maximumGpa);

    if (!Number.isFinite(numericMaximum) || numericMaximum <= 0) {
      collector.addError(
        "academic.maximumGpa",
        "The maximum GPA must be greater than zero.",
        "invalid_number",
      );
    }
  }

  if (
    Number.isFinite(Number(gpa)) &&
    Number.isFinite(Number(maximumGpa)) &&
    Number(maximumGpa) > 0 &&
    Number(gpa) > Number(maximumGpa)
  ) {
    collector.addError(
      "academic.gpa",
      "GPA cannot exceed the maximum GPA.",
      "gpa_exceeds_maximum",
    );
  }

  validateNamedItems(collector, academic.honors, {
    field: "academic.honors",
    itemLabel: "Honor",
    nameLimit: EDUCATION_FIELD_LIMITS.honorName,
    descriptionLimit: EDUCATION_FIELD_LIMITS.honorDescription,
    maximumItems: EDUCATION_FIELD_LIMITS.maximumHonors,
  });
}

/*
 * =========================================
 * Named Ordered Items
 * =========================================
 */

function validateNamedItems(
  collector,
  values,
  { field, itemLabel, nameLimit, descriptionLimit, maximumItems },
) {
  const items = getArray(values);

  if (items.length > maximumItems) {
    collector.addError(
      field,
      `Add no more than ${maximumItems} ${itemLabel.toLowerCase()} records.`,
      "too_many_items",
    );
  }

  items.forEach((item, index) => {
    const itemObject = getObject(item);

    const name =
      typeof item === "string"
        ? getText(item)
        : getText(itemObject.name || itemObject.title);

    if (!name) {
      collector.addError(
        `${field}.${index}.name`,
        `${itemLabel} name cannot be empty.`,
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `${field}.${index}.name`,
      name,
      nameLimit,
      `${itemLabel} name`,
    );

    validateTextLength(
      collector,
      `${field}.${index}.description`,
      itemObject.description,
      descriptionLimit,
      `${itemLabel} description`,
    );

    validateOrder(collector, `${field}.${index}.order`, itemObject.order);
  });

  findDuplicateIndexes(items, (item) =>
    typeof item === "string" ? item : item?.name || item?.title || "",
  ).forEach(({ duplicateIndex }) => {
    collector.addError(
      `${field}.${duplicateIndex}.name`,
      `This ${itemLabel.toLowerCase()} has already been added.`,
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Coursework and Activities
 * =========================================
 */

function validateCoursework(collector, education) {
  validateNamedItems(collector, education.coursework, {
    field: "coursework",
    itemLabel: "Course",
    nameLimit: EDUCATION_FIELD_LIMITS.courseworkName,
    descriptionLimit: EDUCATION_FIELD_LIMITS.courseworkDescription,
    maximumItems: EDUCATION_FIELD_LIMITS.maximumCoursework,
  });
}

function validateActivities(collector, education) {
  validateNamedItems(collector, education.activities, {
    field: "activities",
    itemLabel: "Activity",
    nameLimit: EDUCATION_FIELD_LIMITS.activityName,
    descriptionLimit: EDUCATION_FIELD_LIMITS.activityDescription,
    maximumItems: EDUCATION_FIELD_LIMITS.maximumActivities,
  });
}

/*
 * =========================================
 * Skill Relationships
 * =========================================
 */

function getSkillRelationshipId(relationship) {
  const item = getObject(relationship);

  return getText(item.skillId || item.profileSkillId);
}

function getSkillSnapshotName(relationship) {
  const item = getObject(relationship);

  return getText(item.nameSnapshot || item.name || item.label);
}

function validateSkillRelationships(collector, education) {
  const relationships = getArray(education.skillRelationships);

  if (relationships.length > EDUCATION_FIELD_LIMITS.maximumSkills) {
    collector.addError(
      "skillRelationships",
      `Add no more than ${EDUCATION_FIELD_LIMITS.maximumSkills} skills.`,
      "too_many_items",
    );
  }

  relationships.forEach((relationship, index) => {
    const item = getObject(relationship);

    const skillId = getSkillRelationshipId(item);

    const nameSnapshot = getSkillSnapshotName(item);

    if (!skillId && !nameSnapshot) {
      collector.addError(
        `skillRelationships.${index}.skillId`,
        "Select a saved skill or provide a skill name.",
        "required",
      );

      return;
    }

    if (skillId && !nameSnapshot) {
      collector.addError(
        `skillRelationships.${index}.nameSnapshot`,
        "Store the skill name snapshot with this relationship.",
        "required_snapshot",
      );
    }

    if (!skillId && nameSnapshot) {
      collector.addWarning(
        `skillRelationships.${index}.skillId`,
        `"${nameSnapshot}" is not connected to the central Skill Library.`,
        "missing_skill_relationship",
      );
    }

    validateTextLength(
      collector,
      `skillRelationships.${index}.skillId`,
      skillId,
      200,
      "Skill identifier",
    );

    validateTextLength(
      collector,
      `skillRelationships.${index}.nameSnapshot`,
      nameSnapshot,
      EDUCATION_FIELD_LIMITS.skillName,
      "Skill name",
    );

    validateTextLength(
      collector,
      `skillRelationships.${index}.categorySnapshot`,
      item.categorySnapshot,
      EDUCATION_FIELD_LIMITS.skillCategory,
      "Skill category snapshot",
    );

    validateTextLength(
      collector,
      `skillRelationships.${index}.typeSnapshot`,
      item.typeSnapshot,
      EDUCATION_FIELD_LIMITS.skillType,
      "Skill type snapshot",
    );

    validateOrder(collector, `skillRelationships.${index}.order`, item.order);
  });

  findDuplicateIndexes(relationships, (relationship) => {
    const skillId = getSkillRelationshipId(relationship);

    return skillId
      ? `id:${skillId}`
      : `name:${getSkillSnapshotName(relationship)}`;
  }).forEach(({ duplicateIndex }) => {
    collector.addError(
      `skillRelationships.${duplicateIndex}.skillId`,
      "This skill has already been connected to the education record.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Supporting Documents
 * =========================================
 */

function validateSupportingDocuments(collector, education) {
  const documents = getArray(education.supportingDocuments);

  if (documents.length > DOCUMENT_FILE_LIMITS.maximumDocumentsPerRecord) {
    collector.addError(
      "supportingDocuments",
      `Add no more than ${DOCUMENT_FILE_LIMITS.maximumDocumentsPerRecord} supporting documents.`,
      "too_many_items",
    );
  }

  documents.forEach((document, index) => {
    const item = getObject(document);

    if (!getText(item.name)) {
      collector.addError(
        `supportingDocuments.${index}.name`,
        "Enter a document name.",
        "required",
      );
    }

    if (!getText(item.fileName)) {
      collector.addError(
        `supportingDocuments.${index}.fileName`,
        "The document file name is missing.",
        "required",
      );
    }

    if (!getText(item.storageKey) && !getText(item.fileUrl)) {
      collector.addError(
        `supportingDocuments.${index}.storageKey`,
        "The document does not have a valid storage location.",
        "required",
      );
    }

    if (!isValidEducationDocumentType(item.documentType)) {
      collector.addError(
        `supportingDocuments.${index}.documentType`,
        "Select a valid education document type.",
        "invalid_option",
      );
    }

    if (!isValidDocumentVisibility(item.visibility)) {
      collector.addError(
        `supportingDocuments.${index}.visibility`,
        "Select a valid document visibility.",
        "invalid_option",
      );
    }

    validateTextLength(
      collector,
      `supportingDocuments.${index}.name`,
      item.name,
      DOCUMENT_FILE_LIMITS.documentName,
      "Document name",
    );

    validateTextLength(
      collector,
      `supportingDocuments.${index}.description`,
      item.description,
      DOCUMENT_FILE_LIMITS.description,
      "Document description",
    );

    validateTextLength(
      collector,
      `supportingDocuments.${index}.fileName`,
      item.fileName,
      DOCUMENT_FILE_LIMITS.fileName,
      "File name",
    );

    validateTextLength(
      collector,
      `supportingDocuments.${index}.mimeType`,
      item.mimeType,
      200,
      "Document MIME type",
    );

    validateTextLength(
      collector,
      `supportingDocuments.${index}.storageKey`,
      item.storageKey,
      DOCUMENT_FILE_LIMITS.storageKey,
      "Document storage key",
    );

    validateTextLength(
      collector,
      `supportingDocuments.${index}.fileUrl`,
      item.fileUrl,
      DOCUMENT_FILE_LIMITS.fileUrl,
      "Document URL",
    );

    const fileSize = Number(item.fileSize);

    if (!Number.isFinite(fileSize) || fileSize < 0) {
      collector.addError(
        `supportingDocuments.${index}.fileSize`,
        "The document file size is invalid.",
        "invalid_file_size",
      );
    } else if (fileSize > DOCUMENT_FILE_LIMITS.maximumFileSizeBytes) {
      collector.addError(
        `supportingDocuments.${index}.fileSize`,
        "The document exceeds the maximum file size.",
        "file_too_large",
      );
    }

    validateOrder(collector, `supportingDocuments.${index}.order`, item.order);
  });

  findDuplicateIndexes(
    documents,
    (document) =>
      document?.storageKey || document?.fileUrl || document?.fileName || "",
  ).forEach(({ duplicateIndex }) => {
    collector.addError(
      `supportingDocuments.${duplicateIndex}.fileName`,
      "This supporting document has already been added.",
      "duplicate",
    );
  });
}

/*
 * =========================================
 * Related Record IDs
 * =========================================
 */

function validateIdentifierCollection(
  collector,
  values,
  field,
  label,
  maximumItems,
) {
  const identifiers = getArray(values);

  if (identifiers.length > maximumItems) {
    collector.addError(
      field,
      `Select no more than ${maximumItems} ${label}.`,
      "too_many_items",
    );
  }

  identifiers.forEach((identifier, index) => {
    if (!getText(identifier)) {
      collector.addError(
        `${field}.${index}`,
        `The ${label} identifier cannot be empty.`,
        "required",
      );
    }

    validateTextLength(
      collector,
      `${field}.${index}`,
      identifier,
      200,
      `${label} identifier`,
    );
  });

  findDuplicateIndexes(identifiers, (identifier) => identifier).forEach(
    ({ duplicateIndex }) => {
      collector.addError(
        `${field}.${duplicateIndex}`,
        `This ${label} record has already been selected.`,
        "duplicate",
      );
    },
  );
}

function validateRelatedRecords(collector, education) {
  validateIdentifierCollection(
    collector,
    education.relatedCertificationIds,
    "relatedCertificationIds",
    "certification",
    EDUCATION_FIELD_LIMITS.maximumRelatedCertifications,
  );

  validateIdentifierCollection(
    collector,
    education.relatedTrainingIds,
    "relatedTrainingIds",
    "training",
    EDUCATION_FIELD_LIMITS.maximumRelatedTraining,
  );

  validateIdentifierCollection(
    collector,
    education.relatedProjectIds,
    "relatedProjectIds",
    "project",
    EDUCATION_FIELD_LIMITS.maximumRelatedProjects,
  );
}

/*
 * =========================================
 * Supporting Information
 * =========================================
 */

function validateSupportingInformation(collector, education) {
  validateTextLength(
    collector,
    "description",
    education.description,
    EDUCATION_FIELD_LIMITS.description,
    "Education description",
  );

  validateTextLength(
    collector,
    "privateInformation.notes",
    education.privateInformation?.notes,
    EDUCATION_FIELD_LIMITS.privateNotes,
    "Private notes",
  );

  validateTextLength(
    collector,
    "sourceContext",
    education.sourceContext,
    EDUCATION_FIELD_LIMITS.sourceContext,
    "Source context",
  );

  const hasSupportingInformation =
    Boolean(getText(education.description)) ||
    getArray(education.coursework).length > 0 ||
    getArray(education.academic?.honors).length > 0 ||
    getArray(education.activities).length > 0 ||
    getArray(education.skillRelationships).length > 0;

  if (!hasSupportingInformation) {
    collector.addWarning(
      "description",
      "Consider adding a description, honor, course, activity, or related skill.",
      "limited_supporting_information",
    );
  }
}

/*
 * =========================================
 * Field Error Map
 * =========================================
 */

export function createEducationFieldErrorMap(errors = []) {
  return errors.reduce((fieldErrors, error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }

    return fieldErrors;
  }, {});
}

/*
 * =========================================
 * Main Validation
 * =========================================
 */

export function validateEducation(educationValue) {
  const education = getObject(educationValue);

  const collector = createValidationCollector();

  validateRequiredInformation(collector, education);

  validateConfiguredOptions(collector, education);

  validateInstitutionAndCredential(collector, education);

  validateDates(collector, education);

  validateLocation(collector, education);

  validateAcademicInformation(collector, education);

  validateCoursework(collector, education);

  validateActivities(collector, education);

  validateSkillRelationships(collector, education);

  validateSupportingDocuments(collector, education);

  validateRelatedRecords(collector, education);

  validateSupportingInformation(collector, education);

  return {
    isValid: collector.errors.length === 0,

    errors: collector.errors,

    warnings: collector.warnings,

    fieldErrors: createEducationFieldErrorMap(collector.errors),
  };
}

/*
 * =========================================
 * Assertion
 * =========================================
 */

export function assertValidEducation(education) {
  const validation = validateEducation(education);

  if (validation.isValid) {
    return validation;
  }

  const error = new Error(
    "The education record contains invalid or incomplete information.",
  );

  error.name = "EducationValidationError";

  error.code = "EDUCATION_VALIDATION_FAILED";

  error.status = 400;

  error.publicMessage =
    "Correct the highlighted education information before saving.";

  error.validation = validation;
  error.errors = validation.errors;
  error.warnings = validation.warnings;
  error.fieldErrors = validation.fieldErrors;

  throw error;
}

/*
 * =========================================
 * Validation Summary
 * =========================================
 */

export function getEducationValidationSummary(education) {
  const validation = validateEducation(education);

  if (!validation.isValid) {
    return `${validation.errors.length} ${
      validation.errors.length === 1 ? "problem must" : "problems must"
    } be corrected before saving.`;
  }

  if (validation.warnings.length > 0) {
    return `Ready to save with ${validation.warnings.length} ${
      validation.warnings.length === 1 ? "suggestion" : "suggestions"
    } for improvement.`;
  }

  return "This education record is complete and ready to save.";
}
