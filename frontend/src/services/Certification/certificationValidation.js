import {
  CERTIFICATION_DOCUMENT_EXTENSIONS,
  CERTIFICATION_DOCUMENT_MIME_TYPES,
  CERTIFICATION_FIELD_LIMITS,
  getCertificationDocumentExtension,
} from "../../config/certificationConfig.js";

import {
  getEffectiveCredentialState,
  normalizeCertification,
} from "../../models/certificationModel.js";

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

function isHttpUrl(value) {
  const text = getText(value);

  if (!text) {
    return true;
  }

  try {
    const url = new URL(text);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createIdSet(records) {
  return new Set(
    getArray(records)
      .map((record) => getText(record?.id))
      .filter(Boolean),
  );
}

/*
 * =========================================
 * Validation Collector
 * =========================================
 */

function createValidationCollector() {
  const errors = [];
  const warnings = [];
  const fieldErrors = {};

  const addError = (code, field, message) => {
    errors.push({
      code,
      field,
      message,
    });

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = message;
    }
  };

  const addWarning = (code, field, message) => {
    warnings.push({
      code,
      field,
      message,
    });
  };

  return {
    errors,
    warnings,
    fieldErrors,
    addError,
    addWarning,
  };
}

/*
 * =========================================
 * Core Information
 * =========================================
 */

function validateCoreInformation(certification, collector) {
  const { addError, addWarning } = collector;

  if (!certification.name) {
    addError(
      "CERTIFICATION_NAME_REQUIRED",
      "name",
      "Enter the certification name.",
    );
  } else if (certification.name.length > CERTIFICATION_FIELD_LIMITS.name) {
    addError(
      "CERTIFICATION_NAME_TOO_LONG",
      "name",
      `The certification name cannot exceed ${CERTIFICATION_FIELD_LIMITS.name} characters.`,
    );
  }

  if (!certification.certificationType) {
    addError(
      "CERTIFICATION_TYPE_REQUIRED",
      "certificationType",
      "Select a certification type.",
    );
  }

  const issuer = certification.issuingOrganization;

  if (!issuer.name) {
    addError(
      "CERTIFICATION_ISSUER_REQUIRED",
      "issuingOrganization.name",
      "Enter the issuing organization.",
    );
  } else if (issuer.name.length > CERTIFICATION_FIELD_LIMITS.issuerName) {
    addError(
      "CERTIFICATION_ISSUER_TOO_LONG",
      "issuingOrganization.name",
      `The issuing organization cannot exceed ${CERTIFICATION_FIELD_LIMITS.issuerName} characters.`,
    );
  }

  if (issuer.website.length > CERTIFICATION_FIELD_LIMITS.issuerWebsite) {
    addError(
      "CERTIFICATION_ISSUER_WEBSITE_TOO_LONG",
      "issuingOrganization.website",
      `The issuing-organization website cannot exceed ${CERTIFICATION_FIELD_LIMITS.issuerWebsite} characters.`,
    );
  } else if (!isHttpUrl(issuer.website)) {
    addError(
      "CERTIFICATION_ISSUER_WEBSITE_INVALID",
      "issuingOrganization.website",
      "Enter a valid website beginning with http:// or https://.",
    );
  }

  if (
    certification.description.length > CERTIFICATION_FIELD_LIMITS.description
  ) {
    addError(
      "CERTIFICATION_DESCRIPTION_TOO_LONG",
      "description",
      `The description cannot exceed ${CERTIFICATION_FIELD_LIMITS.description} characters.`,
    );
  } else if (!certification.description) {
    addWarning(
      "CERTIFICATION_DESCRIPTION_RECOMMENDED",
      "description",
      "Add a description explaining the certification's professional value.",
    );
  }
}

/*
 * =========================================
 * Dates and Credential
 * =========================================
 */

function validateDatesAndCredential(certification, collector) {
  const { dates, credential } = certification;

  const { addError, addWarning } = collector;

  if (credential.state !== "planned" && !dates.issueDate) {
    addError(
      "CERTIFICATION_ISSUE_DATE_REQUIRED",
      "dates.issueDate",
      "Enter the date the certification was issued.",
    );
  }

  if (
    dates.issueDate &&
    dates.expirationDate &&
    dates.expirationDate < dates.issueDate
  ) {
    addError(
      "CERTIFICATION_EXPIRATION_BEFORE_ISSUE",
      "dates.expirationDate",
      "The expiration date cannot be earlier than the issue date.",
    );
  }

  if (
    dates.issueDate &&
    dates.lastRenewedDate &&
    dates.lastRenewedDate < dates.issueDate
  ) {
    addError(
      "CERTIFICATION_RENEWAL_BEFORE_ISSUE",
      "dates.lastRenewedDate",
      "The last renewal date cannot be earlier than the issue date.",
    );
  }

  if (
    dates.lastRenewedDate &&
    dates.nextRenewalDate &&
    dates.nextRenewalDate < dates.lastRenewedDate
  ) {
    addError(
      "CERTIFICATION_NEXT_RENEWAL_INVALID",
      "dates.nextRenewalDate",
      "The next renewal date cannot be earlier than the last renewal date.",
    );
  }

  if (
    dates.expirationDate &&
    dates.nextRenewalDate &&
    dates.nextRenewalDate > dates.expirationDate
  ) {
    addWarning(
      "CERTIFICATION_RENEWAL_AFTER_EXPIRATION",
      "dates.nextRenewalDate",
      "The next renewal date is later than the expiration date.",
    );
  }

  if (dates.doesNotExpire && (dates.expirationDate || dates.nextRenewalDate)) {
    addError(
      "CERTIFICATION_NON_EXPIRING_DATE_CONFLICT",
      "dates.doesNotExpire",
      "A non-expiring certification cannot have an expiration or next-renewal date.",
    );
  }

  if (credential.state === "expired" && !dates.expirationDate) {
    addWarning(
      "CERTIFICATION_EXPIRATION_DATE_RECOMMENDED",
      "dates.expirationDate",
      "Add an expiration date for this expired certification.",
    );
  }

  const effectiveState = getEffectiveCredentialState(certification);

  if (credential.state === "active" && effectiveState === "expired") {
    addWarning(
      "CERTIFICATION_STATE_WILL_BE_EXPIRED",
      "credential.state",
      "The expiration date has passed, so this certification will be displayed as expired.",
    );
  }

  if (
    credential.credentialId.length > CERTIFICATION_FIELD_LIMITS.credentialId
  ) {
    addError(
      "CERTIFICATION_CREDENTIAL_ID_TOO_LONG",
      "credential.credentialId",
      `The credential ID cannot exceed ${CERTIFICATION_FIELD_LIMITS.credentialId} characters.`,
    );
  }

  if (
    credential.verificationUrl.length >
    CERTIFICATION_FIELD_LIMITS.verificationUrl
  ) {
    addError(
      "CERTIFICATION_VERIFICATION_URL_TOO_LONG",
      "credential.verificationUrl",
      `The verification URL cannot exceed ${CERTIFICATION_FIELD_LIMITS.verificationUrl} characters.`,
    );
  } else if (!isHttpUrl(credential.verificationUrl)) {
    addError(
      "CERTIFICATION_VERIFICATION_URL_INVALID",
      "credential.verificationUrl",
      "Enter a valid verification URL beginning with http:// or https://.",
    );
  }

  if (
    credential.state !== "planned" &&
    !credential.credentialId &&
    !credential.verificationUrl
  ) {
    addWarning(
      "CERTIFICATION_VERIFICATION_RECOMMENDED",
      "credential.credentialId",
      "Add a credential ID or verification URL when one is available.",
    );
  }
}

/*
 * =========================================
 * Skill Relationships
 * =========================================
 */

function validateSkillRelationships(
  certification,
  collector,
  skills,
  shouldCheckSkills,
) {
  const { addError, addWarning } = collector;

  const relationships = certification.skillRelationships;

  if (relationships.length > CERTIFICATION_FIELD_LIMITS.maximumSkills) {
    addError(
      "CERTIFICATION_TOO_MANY_SKILLS",
      "skillRelationships",
      `Add no more than ${CERTIFICATION_FIELD_LIMITS.maximumSkills} related skills.`,
    );
  }

  const availableSkillIds = createIdSet(skills);

  relationships.forEach((relationship, index) => {
    const baseField = `skillRelationships.${index}`;

    if (!relationship.skillId) {
      addError(
        "CERTIFICATION_SKILL_ID_REQUIRED",
        `${baseField}.skillId`,
        "Select a valid Skill Library record.",
      );

      return;
    }

    if (!relationship.snapshot.name) {
      addWarning(
        "CERTIFICATION_SKILL_SNAPSHOT_MISSING",
        `${baseField}.snapshot.name`,
        "The related skill does not have a readable name snapshot.",
      );
    }

    if (
      relationship.snapshot.name.length >
      CERTIFICATION_FIELD_LIMITS.skillSnapshotName
    ) {
      addError(
        "CERTIFICATION_SKILL_SNAPSHOT_TOO_LONG",
        `${baseField}.snapshot.name`,
        `The skill snapshot name cannot exceed ${CERTIFICATION_FIELD_LIMITS.skillSnapshotName} characters.`,
      );
    }

    if (shouldCheckSkills && !availableSkillIds.has(relationship.skillId)) {
      addError(
        "CERTIFICATION_SKILL_NOT_FOUND",
        `${baseField}.skillId`,
        "This skill no longer exists in the central Skill Library.",
      );
    }
  });
}

/*
 * =========================================
 * Training Relationships
 * =========================================
 */

function validateTrainingRelationships(
  certification,
  collector,
  trainingRecords,
  shouldCheckTraining,
) {
  const { addError, addWarning } = collector;

  const relationships = certification.relatedRecords.trainingRelationships;

  if (
    relationships.length >
    CERTIFICATION_FIELD_LIMITS.maximumRelatedTrainingRecords
  ) {
    addError(
      "CERTIFICATION_TOO_MANY_TRAINING_RECORDS",
      "relatedRecords.trainingRelationships",
      `Link no more than ${CERTIFICATION_FIELD_LIMITS.maximumRelatedTrainingRecords} Training records.`,
    );
  }

  const availableTrainingIds = createIdSet(trainingRecords);

  relationships.forEach((relationship, index) => {
    const baseField = `relatedRecords.trainingRelationships.${index}`;

    if (!relationship.trainingId) {
      addError(
        "CERTIFICATION_TRAINING_ID_REQUIRED",
        `${baseField}.trainingId`,
        "Select a valid Training record.",
      );

      return;
    }

    if (!relationship.snapshot.title) {
      addWarning(
        "CERTIFICATION_TRAINING_SNAPSHOT_MISSING",
        `${baseField}.snapshot.title`,
        "The linked Training record does not have a readable title snapshot.",
      );
    }

    if (
      shouldCheckTraining &&
      !availableTrainingIds.has(relationship.trainingId)
    ) {
      addError(
        "CERTIFICATION_TRAINING_NOT_FOUND",
        `${baseField}.trainingId`,
        "This linked Training record no longer exists.",
      );
    }
  });

  if (certification.source === "training" && relationships.length === 0) {
    addWarning(
      "CERTIFICATION_TRAINING_LINK_RECOMMENDED",
      "relatedRecords.trainingRelationships",
      "This certification was created from Training, but no Training record is linked.",
    );
  }
}

/*
 * =========================================
 * Education Relationships
 * =========================================
 */

function validateEducationRelationships(
  certification,
  collector,
  educationRecords,
  shouldCheckEducation,
) {
  const { addError } = collector;

  const educationIds = certification.relatedRecords.educationIds;

  if (
    educationIds.length >
    CERTIFICATION_FIELD_LIMITS.maximumRelatedEducationRecords
  ) {
    addError(
      "CERTIFICATION_TOO_MANY_EDUCATION_RECORDS",
      "relatedRecords.educationIds",
      `Link no more than ${CERTIFICATION_FIELD_LIMITS.maximumRelatedEducationRecords} Education records.`,
    );
  }

  const availableEducationIds = createIdSet(educationRecords);

  educationIds.forEach((educationId, index) => {
    if (shouldCheckEducation && !availableEducationIds.has(educationId)) {
      addError(
        "CERTIFICATION_EDUCATION_NOT_FOUND",
        `relatedRecords.educationIds.${index}`,
        "This linked Education record no longer exists.",
      );
    }
  });
}

/*
 * =========================================
 * Supporting Documents
 * =========================================
 */

function validateSupportingDocuments(certification, collector) {
  const { addError, addWarning } = collector;

  const documents = certification.supportingDocuments;

  if (
    documents.length > CERTIFICATION_FIELD_LIMITS.maximumSupportingDocuments
  ) {
    addError(
      "CERTIFICATION_TOO_MANY_DOCUMENTS",
      "supportingDocuments",
      `Upload no more than ${CERTIFICATION_FIELD_LIMITS.maximumSupportingDocuments} documents.`,
    );
  }

  const activeDocuments = documents.filter(
    (document) => document.status !== "archived",
  );

  const primaryDocuments = activeDocuments.filter(
    (document) => document.isPrimary,
  );

  if (activeDocuments.length > 0 && primaryDocuments.length === 0) {
    addError(
      "CERTIFICATION_PRIMARY_DOCUMENT_REQUIRED",
      "supportingDocuments",
      "Select the primary document used for the Certification item preview.",
    );
  }

  if (primaryDocuments.length > 1) {
    addError(
      "CERTIFICATION_MULTIPLE_PRIMARY_DOCUMENTS",
      "supportingDocuments",
      "Only one active document can be the primary certificate.",
    );
  }

  documents.forEach((document, index) => {
    const baseField = `supportingDocuments.${index}`;

    if (!document.fileName) {
      addError(
        "CERTIFICATION_DOCUMENT_FILE_NAME_REQUIRED",
        `${baseField}.fileName`,
        "The uploaded document must have a file name.",
      );
    }

    if (document.name.length > CERTIFICATION_FIELD_LIMITS.documentName) {
      addError(
        "CERTIFICATION_DOCUMENT_NAME_TOO_LONG",
        `${baseField}.name`,
        `The document name cannot exceed ${CERTIFICATION_FIELD_LIMITS.documentName} characters.`,
      );
    }

    if (
      document.description.length >
      CERTIFICATION_FIELD_LIMITS.documentDescription
    ) {
      addError(
        "CERTIFICATION_DOCUMENT_DESCRIPTION_TOO_LONG",
        `${baseField}.description`,
        `The document description cannot exceed ${CERTIFICATION_FIELD_LIMITS.documentDescription} characters.`,
      );
    }

    const extension =
      getCertificationDocumentExtension(document.fileName) ||
      getText(document.extension).toLocaleLowerCase();

    if (!CERTIFICATION_DOCUMENT_EXTENSIONS.includes(extension)) {
      addError(
        "CERTIFICATION_DOCUMENT_EXTENSION_NOT_SUPPORTED",
        `${baseField}.fileName`,
        "Upload a PDF, Word document, JPG, PNG, or WebP image.",
      );
    }

    const mimeType = getText(document.mimeType).toLocaleLowerCase();

    if (mimeType && !CERTIFICATION_DOCUMENT_MIME_TYPES.includes(mimeType)) {
      addError(
        "CERTIFICATION_DOCUMENT_TYPE_NOT_SUPPORTED",
        `${baseField}.mimeType`,
        "This document file type is not supported.",
      );
    }

    const size = Number(document.size);

    if (!Number.isFinite(size) || size <= 0) {
      addError(
        "CERTIFICATION_DOCUMENT_SIZE_INVALID",
        `${baseField}.size`,
        "The uploaded document is empty or has an invalid size.",
      );
    } else if (size > CERTIFICATION_FIELD_LIMITS.maximumDocumentBytes) {
      addError(
        "CERTIFICATION_DOCUMENT_TOO_LARGE",
        `${baseField}.size`,
        "The uploaded document cannot exceed 10 MB.",
      );
    }

    /*
     * The storage key connects the metadata saved in
     * localStorage with the actual Blob in IndexedDB.
     */

    if (document.status !== "archived" && !document.storageKey) {
      addError(
        "CERTIFICATION_DOCUMENT_STORAGE_KEY_REQUIRED",
        `${baseField}.storageKey`,
        "The document could not be connected to browser document storage.",
      );
    }
  });

  if (activeDocuments.length === 0) {
    addWarning(
      "CERTIFICATION_DOCUMENT_RECOMMENDED",
      "supportingDocuments",
      "Upload the certificate so it can be previewed from the Certification Library.",
    );
  }
}

/*
 * =========================================
 * Private and Source Information
 * =========================================
 */

function validatePrivateInformation(certification, collector) {
  const { addError } = collector;

  if (
    certification.privateInformation.notes.length >
    CERTIFICATION_FIELD_LIMITS.privateNotes
  ) {
    addError(
      "CERTIFICATION_PRIVATE_NOTES_TOO_LONG",
      "privateInformation.notes",
      `Private notes cannot exceed ${CERTIFICATION_FIELD_LIMITS.privateNotes} characters.`,
    );
  }

  if (
    certification.sourceContext.length >
    CERTIFICATION_FIELD_LIMITS.sourceContext
  ) {
    addError(
      "CERTIFICATION_SOURCE_CONTEXT_TOO_LONG",
      "sourceContext",
      `The source context cannot exceed ${CERTIFICATION_FIELD_LIMITS.sourceContext} characters.`,
    );
  }
}

/*
 * =========================================
 * Main Validation
 * =========================================
 */

export function validateCertification(
  value,
  { skills = null, trainingRecords = null, educationRecords = null } = {},
) {
  const certification = normalizeCertification(value);

  const collector = createValidationCollector();

  validateCoreInformation(certification, collector);

  validateDatesAndCredential(certification, collector);

  validateSkillRelationships(
    certification,
    collector,
    getArray(skills),
    Array.isArray(skills),
  );

  validateTrainingRelationships(
    certification,
    collector,
    getArray(trainingRecords),
    Array.isArray(trainingRecords),
  );

  validateEducationRelationships(
    certification,
    collector,
    getArray(educationRecords),
    Array.isArray(educationRecords),
  );

  validateSupportingDocuments(certification, collector);

  validatePrivateInformation(certification, collector);

  return {
    isValid: collector.errors.length === 0,

    certification,

    errors: collector.errors,

    warnings: collector.warnings,

    fieldErrors: collector.fieldErrors,
  };
}

/*
 * =========================================
 * Validation Summary
 * =========================================
 */

export function getCertificationValidationSummary(value) {
  const certification = normalizeCertification(value);

  const checks = [
    Boolean(certification.name),

    Boolean(certification.issuingOrganization.name),

    Boolean(
      certification.dates.issueDate ||
      certification.credential.state === "planned",
    ),

    Boolean(
      certification.credential.credentialId ||
      certification.credential.verificationUrl,
    ),

    Boolean(certification.description),

    certification.supportingDocuments.some(
      (document) => document.status !== "archived",
    ),
  ];

  const completed = checks.filter(Boolean).length;

  return `${completed}/${checks.length} recommended sections complete`;
}
