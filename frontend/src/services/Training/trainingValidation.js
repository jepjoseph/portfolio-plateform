import {
  TRAINING_FIELD_LIMITS,
  isValidTrainingCompletionStatus,
  isValidTrainingDeliveryFormat,
  isValidTrainingDocumentType,
  isValidTrainingProviderType,
  isValidTrainingSource,
  isValidTrainingStatus,
  isValidTrainingType,
} from "../../config/trainingConfig.js";

import {
  DOCUMENT_FILE_LIMITS,
  isValidDocumentVisibility,
} from "../../config/documentConfig.js";

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
  return { field, message, code };
}

function createCollector() {
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

function validateTextLength(collector, field, value, limit, label) {
  if (typeof value === "string" && value.trim().length > limit) {
    collector.addError(
      field,
      `${label} cannot exceed ${limit} characters.`,
      "too_long",
    );
  }
}

function validateOrder(collector, field, value) {
  if (
    value !== undefined &&
    value !== null &&
    (!Number.isInteger(value) || value < 0)
  ) {
    collector.addError(
      field,
      "Item order must be a whole number of zero or greater.",
      "invalid_order",
    );
  }
}

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/;

const CERTIFICATION_SNAPSHOT_LIMITS = Object.freeze({
  name: 160,
  issuingOrganizationName: 160,
  certificationType: 100,
  credentialState: 100,
});

const VALID_CERTIFICATION_STATES = new Set(["active", "expired", "planned"]);

function isValidDate(value) {
  const text = getText(value);

  if (!DATE_PATTERN.test(text)) {
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

function getComparableDate(value, endOfMonth = false) {
  if (!isValidDate(value)) {
    return null;
  }

  const [year, month, suppliedDay] = value.split("-").map(Number);

  const day =
    suppliedDay ||
    (endOfMonth ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 1);

  return Date.UTC(year, month - 1, day);
}

function isValidUrl(value) {
  const text = getText(value);

  if (!text) {
    return true;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);

    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/*
 * =========================================
 * Certification Helpers
 * =========================================
 */

function getCertificationRelationships(training) {
  if (Array.isArray(training?.certificationRelationships)) {
    return training.certificationRelationships;
  }

  /*
   * Support Training model version 1, which stored
   * only related Certification IDs.
   */

  return getArray(training?.relatedCertificationIds).map(
    (certificationId, index) => ({
      certificationId:
        typeof certificationId === "string"
          ? certificationId
          : certificationId?.id || "",

      order: index,

      snapshot: {},
    }),
  );
}

function getCertificationIdSet(certifications) {
  return new Set(
    getArray(certifications)
      .map((certification) => getText(certification?.id))
      .filter(Boolean),
  );
}

function findCertificationById(certifications, certificationId) {
  return getArray(certifications).find(
    (certification) => getText(certification?.id) === certificationId,
  );
}

function getCertificationState(certification) {
  return getText(
    certification?.credential?.state || certification?.credentialState,
  );
}

function normalizeComparisonText(value) {
  return getText(value).normalize("NFKC").toLocaleLowerCase();
}

function validateRequiredInformation(collector, training) {
  if (!getText(training.title)) {
    collector.addError("title", "Enter a training title.", "required");
  }

  if (!getText(training.provider?.name)) {
    collector.addError(
      "provider.name",
      "Enter the training provider name.",
      "required",
    );
  }

  if (!getText(training.trainingType)) {
    collector.addError("trainingType", "Select a training type.", "required");
  }

  if (!getText(training.dates?.startDate)) {
    collector.addError(
      "dates.startDate",
      "Enter the training start date.",
      "required",
    );
  }

  if (!getText(training.completion?.status)) {
    collector.addError(
      "completion.status",
      "Select a completion status.",
      "required",
    );
  }
}

function validateOptions(collector, training) {
  if (!isValidTrainingType(training.trainingType)) {
    collector.addError(
      "trainingType",
      "Select a valid training type.",
      "invalid_option",
    );
  }

  if (!isValidTrainingProviderType(training.provider?.type ?? "")) {
    collector.addError(
      "provider.type",
      "Select a valid provider type.",
      "invalid_option",
    );
  }

  if (!isValidTrainingDeliveryFormat(training.delivery?.format)) {
    collector.addError(
      "delivery.format",
      "Select a valid delivery format.",
      "invalid_option",
    );
  }

  if (!isValidTrainingCompletionStatus(training.completion?.status)) {
    collector.addError(
      "completion.status",
      "Select a valid completion status.",
      "invalid_option",
    );
  }

  if (!isValidTrainingSource(training.source)) {
    collector.addError(
      "source",
      "Select a valid training source.",
      "invalid_option",
    );
  }

  if (!isValidTrainingStatus(training.status)) {
    collector.addError(
      "status",
      "Select a valid record status.",
      "invalid_option",
    );
  }
}

function validatePrimaryFields(collector, training) {
  validateTextLength(
    collector,
    "title",
    training.title,
    TRAINING_FIELD_LIMITS.title,
    "Training title",
  );

  validateTextLength(
    collector,
    "provider.name",
    training.provider?.name,
    TRAINING_FIELD_LIMITS.providerName,
    "Provider name",
  );

  validateTextLength(
    collector,
    "provider.website",
    training.provider?.website,
    TRAINING_FIELD_LIMITS.providerWebsite,
    "Provider website",
  );

  if (!isValidUrl(training.provider?.website)) {
    collector.addError(
      "provider.website",
      "Enter a valid provider website.",
      "invalid_url",
    );
  }

  validateTextLength(
    collector,
    "description",
    training.description,
    TRAINING_FIELD_LIMITS.description,
    "Training description",
  );
}

function validateDates(collector, training) {
  const startDate = getText(training.dates?.startDate);
  const endDate = getText(training.dates?.endDate);
  const isCurrent = training.dates?.isCurrent === true;

  if (startDate && !isValidDate(startDate)) {
    collector.addError(
      "dates.startDate",
      "Enter a valid start date.",
      "invalid_date",
    );
  }

  if (isCurrent && endDate) {
    collector.addError(
      "dates.endDate",
      "Current training cannot have an end date.",
      "current_training_has_end_date",
    );
  }

  if (!isCurrent && !endDate) {
    collector.addError(
      "dates.endDate",
      "Enter an end date or mark the training as current.",
      "required",
    );
  }

  if (endDate && !isValidDate(endDate)) {
    collector.addError(
      "dates.endDate",
      "Enter a valid end date.",
      "invalid_date",
    );
  }

  if (
    isValidDate(startDate) &&
    isValidDate(endDate) &&
    getComparableDate(endDate, true) < getComparableDate(startDate)
  ) {
    collector.addError(
      "dates.endDate",
      "The end date cannot be earlier than the start date.",
      "invalid_date_order",
    );
  }
}

function validateCompletion(collector, training) {
  const completion = getObject(training.completion);
  const duration = completion.durationHours;

  if (duration !== null && duration !== undefined && duration !== "") {
    const numericDuration = Number(duration);

    if (!Number.isFinite(numericDuration) || numericDuration < 0) {
      collector.addError(
        "completion.durationHours",
        "Duration must be zero or greater.",
        "invalid_number",
      );
    } else if (numericDuration > TRAINING_FIELD_LIMITS.maximumDurationHours) {
      collector.addError(
        "completion.durationHours",
        `Duration cannot exceed ${TRAINING_FIELD_LIMITS.maximumDurationHours} hours.`,
        "invalid_number",
      );
    }
  }

  validateTextLength(
    collector,
    "completion.credentialId",
    completion.credentialId,
    TRAINING_FIELD_LIMITS.credentialId,
    "Credential ID",
  );

  validateTextLength(
    collector,
    "completion.credentialUrl",
    completion.credentialUrl,
    TRAINING_FIELD_LIMITS.credentialUrl,
    "Credential URL",
  );

  if (!isValidUrl(completion.credentialUrl)) {
    collector.addError(
      "completion.credentialUrl",
      "Enter a valid credential URL.",
      "invalid_url",
    );
  }

  if (
    completion.certificateEarned === true &&
    getCertificationRelationships(training).length === 0 &&
    !getText(completion.credentialId) &&
    !getText(completion.credentialUrl) &&
    getArray(training.supportingDocuments).length === 0
  ) {
    collector.addWarning(
      "completion.certificateEarned",
      "Consider adding a credential ID, verification URL, or certificate document.",
      "missing_credential_evidence",
    );
  }
}

function validateLocation(collector, training) {
  const location = getObject(training.delivery?.location);

  [
    ["city", TRAINING_FIELD_LIMITS.city, "City"],
    ["stateRegion", TRAINING_FIELD_LIMITS.stateRegion, "State or region"],
    ["country", TRAINING_FIELD_LIMITS.country, "Country"],
    [
      "displayValue",
      TRAINING_FIELD_LIMITS.locationDisplayValue,
      "Display location",
    ],
  ].forEach(([field, limit, label]) => {
    validateTextLength(
      collector,
      `delivery.location.${field}`,
      location[field],
      limit,
      label,
    );
  });
}

function validateOrderedItems(
  collector,
  values,
  { field, maximumItems, textField, textLimit, label },
) {
  const items = getArray(values);

  if (items.length > maximumItems) {
    collector.addError(
      field,
      `Add no more than ${maximumItems} ${label.toLowerCase()} records.`,
      "too_many_items",
    );
  }

  const identities = new Set();

  items.forEach((item, index) => {
    const object = getObject(item);

    const text = getText(typeof item === "string" ? item : object[textField]);

    if (!text) {
      collector.addError(
        `${field}.${index}.${textField}`,
        `${label} cannot be empty.`,
        "required",
      );
    }

    validateTextLength(
      collector,
      `${field}.${index}.${textField}`,
      text,
      textLimit,
      label,
    );

    validateOrder(collector, `${field}.${index}.order`, object.order);

    const identity = text.toLocaleLowerCase();

    if (identity && identities.has(identity)) {
      collector.addError(
        `${field}.${index}.${textField}`,
        `This ${label.toLowerCase()} has already been added.`,
        "duplicate",
      );
    }

    identities.add(identity);
  });
}

function validateTrainingDetails(collector, training) {
  validateOrderedItems(collector, training.instructors, {
    field: "instructors",
    maximumItems: TRAINING_FIELD_LIMITS.maximumInstructors,
    textField: "name",
    textLimit: TRAINING_FIELD_LIMITS.instructorName,
    label: "Instructor",
  });

  validateOrderedItems(collector, training.topics, {
    field: "topics",
    maximumItems: TRAINING_FIELD_LIMITS.maximumTopics,
    textField: "name",
    textLimit: TRAINING_FIELD_LIMITS.topicName,
    label: "Topic",
  });

  validateOrderedItems(collector, training.learningOutcomes, {
    field: "learningOutcomes",
    maximumItems: TRAINING_FIELD_LIMITS.maximumLearningOutcomes,
    textField: "text",
    textLimit: TRAINING_FIELD_LIMITS.outcomeText,
    label: "Learning outcome",
  });
}

function validateSkillRelationships(collector, training) {
  const relationships = getArray(training.skillRelationships);
  const identities = new Set();

  if (relationships.length > TRAINING_FIELD_LIMITS.maximumSkills) {
    collector.addError(
      "skillRelationships",
      `Add no more than ${TRAINING_FIELD_LIMITS.maximumSkills} skills.`,
      "too_many_items",
    );
  }

  relationships.forEach((relationship, index) => {
    const item = getObject(relationship);
    const skillId = getText(item.skillId || item.profileSkillId);
    const name = getText(item.nameSnapshot || item.name);

    if (!skillId && !name) {
      collector.addError(
        `skillRelationships.${index}.skillId`,
        "Select a saved skill or provide a skill name.",
        "required",
      );
    }

    if (skillId && !name) {
      collector.addError(
        `skillRelationships.${index}.nameSnapshot`,
        "Store the skill name snapshot with this relationship.",
        "required_snapshot",
      );
    }

    if (!skillId && name) {
      collector.addWarning(
        `skillRelationships.${index}.skillId`,
        `"${name}" is not connected to the central Skill Library.`,
        "missing_skill_relationship",
      );
    }

    const identity = (
      skillId ? `id:${skillId}` : `name:${name}`
    ).toLocaleLowerCase();

    if (identities.has(identity)) {
      collector.addError(
        `skillRelationships.${index}.skillId`,
        "This skill has already been added.",
        "duplicate",
      );
    }

    identities.add(identity);

    validateOrder(collector, `skillRelationships.${index}.order`, item.order);
  });
}

/*
 * =========================================
 * Certification Relationships
 * =========================================
 */

function validateCertificationRelationships(
  collector,
  training,
  certifications,
  shouldCheckCertifications,
) {
  const relationships = getCertificationRelationships(training);

  const availableCertificationIds = getCertificationIdSet(certifications);

  const usedCertificationIds = new Set();

  if (
    relationships.length > TRAINING_FIELD_LIMITS.maximumRelatedCertifications
  ) {
    collector.addError(
      "certificationRelationships",
      `Link no more than ${TRAINING_FIELD_LIMITS.maximumRelatedCertifications} Certifications.`,
      "too_many_certification_relationships",
    );
  }

  relationships.forEach((relationship, index) => {
    const item = getObject(relationship);

    const certificationId = getText(
      item.certificationId || item.certificationRecordId || item.credentialId,
    );

    const snapshot = getObject(item.snapshot);

    const certificationIdField = `certificationRelationships.${index}.certificationId`;

    const snapshotField = `certificationRelationships.${index}.snapshot`;

    if (!certificationId) {
      collector.addError(
        certificationIdField,
        "Select a valid Certification Library record.",
        "certification_id_required",
      );

      return;
    }

    const comparisonId = certificationId.toLocaleLowerCase();

    if (usedCertificationIds.has(comparisonId)) {
      collector.addError(
        certificationIdField,
        "This Certification has already been linked.",
        "duplicate_certification_relationship",
      );
    } else {
      usedCertificationIds.add(comparisonId);
    }

    validateOrder(
      collector,
      `certificationRelationships.${index}.order`,
      item.order,
    );

    /*
     * Readable snapshot validation
     */

    const snapshotName = getText(
      snapshot.name ||
        snapshot.title ||
        item.nameSnapshot ||
        item.certificationName,
    );

    const snapshotIssuer = getText(
      snapshot.issuingOrganizationName ||
        snapshot.issuerName ||
        item.issuingOrganizationName,
    );

    const snapshotType = getText(
      snapshot.certificationType || snapshot.type || item.certificationType,
    );

    const snapshotState = getText(
      snapshot.credentialState || snapshot.state || item.credentialState,
    );

    if (!snapshotName) {
      collector.addError(
        `${snapshotField}.name`,
        "Store the Certification name snapshot with this relationship.",
        "certification_snapshot_required",
      );
    }

    validateTextLength(
      collector,
      `${snapshotField}.name`,
      snapshotName,
      CERTIFICATION_SNAPSHOT_LIMITS.name,
      "Certification snapshot name",
    );

    validateTextLength(
      collector,
      `${snapshotField}.issuingOrganizationName`,
      snapshotIssuer,
      CERTIFICATION_SNAPSHOT_LIMITS.issuingOrganizationName,
      "Certification issuer snapshot",
    );

    validateTextLength(
      collector,
      `${snapshotField}.certificationType`,
      snapshotType,
      CERTIFICATION_SNAPSHOT_LIMITS.certificationType,
      "Certification type snapshot",
    );

    validateTextLength(
      collector,
      `${snapshotField}.credentialState`,
      snapshotState,
      CERTIFICATION_SNAPSHOT_LIMITS.credentialState,
      "Certification state snapshot",
    );

    if (snapshotState && !VALID_CERTIFICATION_STATES.has(snapshotState)) {
      collector.addError(
        `${snapshotField}.credentialState`,
        "The Certification snapshot must use an active, expired, or planned credential state.",
        "invalid_certification_snapshot_state",
      );
    }

    const snapshotIssueDate = getText(snapshot.issueDate);

    const snapshotExpirationDate = getText(snapshot.expirationDate);

    if (snapshotIssueDate && !isValidDate(snapshotIssueDate)) {
      collector.addError(
        `${snapshotField}.issueDate`,
        "The Certification snapshot has an invalid issue date.",
        "invalid_certification_snapshot_date",
      );
    }

    if (snapshotExpirationDate && !isValidDate(snapshotExpirationDate)) {
      collector.addError(
        `${snapshotField}.expirationDate`,
        "The Certification snapshot has an invalid expiration date.",
        "invalid_certification_snapshot_date",
      );
    }

    /*
     * Central Certification Library validation only
     * runs when the caller supplies the collection.
     */

    if (
      shouldCheckCertifications &&
      !availableCertificationIds.has(certificationId)
    ) {
      collector.addError(
        certificationIdField,
        "This linked Certification no longer exists in the Certification Library.",
        "certification_not_found",
      );
    }

    const savedCertification = shouldCheckCertifications
      ? findCertificationById(certifications, certificationId)
      : null;

    if (
      savedCertification &&
      snapshotName &&
      normalizeComparisonText(snapshotName) !==
        normalizeComparisonText(savedCertification.name)
    ) {
      collector.addWarning(
        `${snapshotField}.name`,
        `The saved snapshot does not match the current Certification name "${savedCertification.name}". It will be refreshed when the relationship is synchronized.`,
        "stale_certification_snapshot",
      );
    }

    if (savedCertification?.status === "archived") {
      collector.addWarning(
        certificationIdField,
        `"${savedCertification.name || snapshotName}" is archived in the Certification Library.`,
        "linked_certification_archived",
      );
    }
  });

  validateCertificateEarnedConsistency(
    collector,
    training,
    relationships,
    certifications,
    shouldCheckCertifications,
  );
}

/*
 * =========================================
 * Certificate-Earned Consistency
 * =========================================
 */

function validateCertificateEarnedConsistency(
  collector,
  training,
  relationships,
  certifications,
  shouldCheckCertifications,
) {
  const completion = getObject(training.completion);

  const certificateEarned = completion.certificateEarned === true;

  const credentialId = getText(completion.credentialId);

  const credentialUrl = getText(completion.credentialUrl);

  const linkedCertifications = relationships
    .map((relationship) => {
      const item = getObject(relationship);

      const certificationId = getText(
        item.certificationId || item.certificationRecordId || item.credentialId,
      );

      const savedCertification = shouldCheckCertifications
        ? findCertificationById(certifications, certificationId)
        : null;

      const snapshot = getObject(item.snapshot);

      return {
        certificationId,

        certification: savedCertification,

        state: getText(
          getCertificationState(savedCertification) ||
            snapshot.credentialState ||
            snapshot.state ||
            item.credentialState,
        ),
      };
    })
    .filter((entry) => entry.certificationId);

  const linkedIssuedCertifications = linkedCertifications.filter(
    (entry) => entry.state === "active" || entry.state === "expired",
  );

  const linkedPlannedCertifications = linkedCertifications.filter(
    (entry) => entry.state === "planned",
  );

  /*
   * An active or expired Certification represents
   * an issued credential, so Training should indicate
   * that a certificate was earned.
   */

  if (linkedIssuedCertifications.length > 0 && !certificateEarned) {
    collector.addError(
      "completion.certificateEarned",
      "Mark the certificate as earned because this Training is linked to an active or expired Certification.",
      "linked_certification_not_marked_earned",
    );
  }

  /*
   * A Training linked only to planned credentials
   * should not claim the certificate was earned.
   */

  if (
    certificateEarned &&
    linkedCertifications.length > 0 &&
    linkedIssuedCertifications.length === 0 &&
    linkedPlannedCertifications.length > 0
  ) {
    collector.addError(
      "completion.certificateEarned",
      "A planned Certification has not been earned yet.",
      "planned_certification_marked_earned",
    );
  }

  /*
   * Existing Training records may already contain
   * credential details without a central relationship.
   * Keep this as a warning so those records can still
   * be opened and migrated.
   */

  if (certificateEarned && linkedCertifications.length === 0) {
    collector.addWarning(
      "certificationRelationships",
      "This Training indicates that a certificate was earned, but it is not linked to the Certification Library.",
      "earned_certificate_not_linked",
    );
  }

  /*
   * Credential information should not be entered when
   * Training explicitly says that no certificate was
   * earned, unless the linked credential is planned.
   */

  if (
    !certificateEarned &&
    (credentialId || credentialUrl) &&
    linkedPlannedCertifications.length === 0
  ) {
    collector.addError(
      "completion.certificateEarned",
      "Mark the certificate as earned or remove the credential information.",
      "credential_without_earned_certificate",
    );
  }

  /*
   * When linked Certification records are available,
   * compare legacy Training credential fields with the
   * central Certification Library values.
   */

  if (shouldCheckCertifications && linkedCertifications.length > 0) {
    const savedCredentialIds = linkedCertifications
      .map((entry) => getText(entry.certification?.credential?.credentialId))
      .filter(Boolean);

    const savedVerificationUrls = linkedCertifications
      .map((entry) => getText(entry.certification?.credential?.verificationUrl))
      .filter(Boolean);

    if (
      credentialId &&
      savedCredentialIds.length > 0 &&
      !savedCredentialIds.some(
        (savedCredentialId) =>
          normalizeComparisonText(savedCredentialId) ===
          normalizeComparisonText(credentialId),
      )
    ) {
      collector.addWarning(
        "completion.credentialId",
        "The Training credential ID does not match any linked Certification record.",
        "credential_id_relationship_mismatch",
      );
    }

    if (
      credentialUrl &&
      savedVerificationUrls.length > 0 &&
      !savedVerificationUrls.some(
        (savedUrl) =>
          normalizeComparisonText(savedUrl) ===
          normalizeComparisonText(credentialUrl),
      )
    ) {
      collector.addWarning(
        "completion.credentialUrl",
        "The Training credential URL does not match any linked Certification record.",
        "credential_url_relationship_mismatch",
      );
    }

    if (
      certificateEarned &&
      !credentialId &&
      !credentialUrl &&
      savedCredentialIds.length === 0 &&
      savedVerificationUrls.length === 0 &&
      getArray(training.supportingDocuments).length === 0
    ) {
      collector.addWarning(
        "completion.certificateEarned",
        "Consider adding a credential ID, verification URL, or certificate document to the linked Certification.",
        "missing_linked_credential_evidence",
      );
    }
  }
}

function validateDocuments(collector, training) {
  const documents = getArray(training.supportingDocuments);
  const identities = new Set();

  if (documents.length > TRAINING_FIELD_LIMITS.maximumDocuments) {
    collector.addError(
      "supportingDocuments",
      `Add no more than ${TRAINING_FIELD_LIMITS.maximumDocuments} documents.`,
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

    if (!getText(item.storageKey) && !getText(item.fileUrl)) {
      collector.addError(
        `supportingDocuments.${index}.storageKey`,
        "The document does not have a storage location.",
        "required",
      );
    }

    if (!isValidTrainingDocumentType(item.documentType)) {
      collector.addError(
        `supportingDocuments.${index}.documentType`,
        "Select a valid training document type.",
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

    if (Number(item.fileSize) > DOCUMENT_FILE_LIMITS.maximumFileSizeBytes) {
      collector.addError(
        `supportingDocuments.${index}.fileSize`,
        "The document exceeds the maximum file size.",
        "file_too_large",
      );
    }

    const identity =
      getText(item.storageKey) ||
      getText(item.fileUrl) ||
      getText(item.fileName);

    if (identity && identities.has(identity)) {
      collector.addError(
        `supportingDocuments.${index}.fileName`,
        "This document has already been added.",
        "duplicate",
      );
    }

    identities.add(identity);

    validateOrder(collector, `supportingDocuments.${index}.order`, item.order);
  });
}

function validateSupportingInformation(collector, training) {
  validateTextLength(
    collector,
    "privateInformation.notes",
    training.privateInformation?.notes,
    TRAINING_FIELD_LIMITS.privateNotes,
    "Private notes",
  );

  validateTextLength(
    collector,
    "sourceContext",
    training.sourceContext,
    TRAINING_FIELD_LIMITS.sourceContext,
    "Source context",
  );

  if (
    !getText(training.description) &&
    getArray(training.topics).length === 0 &&
    getArray(training.learningOutcomes).length === 0
  ) {
    collector.addWarning(
      "description",
      "Consider adding a description, topic, or learning outcome.",
      "limited_supporting_information",
    );
  }
}

export function createTrainingFieldErrorMap(errors = []) {
  return errors.reduce((fieldErrors, error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }

    return fieldErrors;
  }, {});
}

export function validateTraining(
  trainingValue,
  { certifications = null } = {},
) {
  const training = getObject(trainingValue);

  const collector = createCollector();

  validateRequiredInformation(collector, training);
  validateOptions(collector, training);
  validatePrimaryFields(collector, training);
  validateDates(collector, training);
  validateCompletion(collector, training);
  validateLocation(collector, training);
  validateTrainingDetails(collector, training);
  validateSkillRelationships(collector, training);

  validateCertificationRelationships(
    collector,
    training,
    getArray(certifications),
    Array.isArray(certifications),
  );

  validateDocuments(collector, training);
  validateSupportingInformation(collector, training);

  return {
    isValid: collector.errors.length === 0,
    errors: collector.errors,
    warnings: collector.warnings,
    fieldErrors: createTrainingFieldErrorMap(collector.errors),
  };
}

export function assertValidTraining(training, options = {}) {
  const validation = validateTraining(training, options);

  if (validation.isValid) {
    return validation;
  }

  const error = new Error(
    "The training record contains invalid or incomplete information.",
  );

  error.name = "TrainingValidationError";
  error.code = "TRAINING_VALIDATION_FAILED";
  error.status = 400;
  error.publicMessage =
    "Correct the highlighted training information before saving.";
  error.validation = validation;
  error.errors = validation.errors;
  error.warnings = validation.warnings;
  error.fieldErrors = validation.fieldErrors;

  throw error;
}

export function getTrainingValidationSummary(training, options = {}) {
  const validation = validateTraining(training, options);

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

  return "This training record is complete and ready to save.";
}
