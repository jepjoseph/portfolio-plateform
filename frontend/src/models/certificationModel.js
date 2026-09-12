import {
  CERTIFICATION_CREDENTIAL_STATE_OPTIONS,
  CERTIFICATION_DOCUMENT_TYPE_OPTIONS,
  CERTIFICATION_ISSUER_TYPE_OPTIONS,
  CERTIFICATION_SOURCE_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  CERTIFICATION_TYPE_OPTIONS,
  getCertificationDocumentPreviewMode,
} from "../config/certificationConfig.js";

export const CERTIFICATION_MODEL_VERSION = 1;

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function createId(prefix = "certification") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getMonth(value) {
  const month = getText(value);

  return MONTH_PATTERN.test(month) ? month : "";
}

function getTimestamp(value, fallback) {
  const timestamp = getText(value);

  return timestamp && Number.isFinite(Date.parse(timestamp))
    ? timestamp
    : fallback;
}

function getFileExtension(fileName) {
  const normalizedName = getText(fileName).toLocaleLowerCase();

  const extensionIndex = normalizedName.lastIndexOf(".");

  return extensionIndex >= 0 ? normalizedName.slice(extensionIndex) : "";
}

function getOptionValue(options, value, fallback) {
  const normalizedValue = getText(value);

  return options.some((option) => option.value === normalizedValue)
    ? normalizedValue
    : fallback;
}

function uniqueTextValues(values) {
  const usedValues = new Set();

  return getArray(values).reduce((result, value) => {
    const text = getText(value);

    if (!text || usedValues.has(text)) {
      return result;
    }

    usedValues.add(text);
    result.push(text);

    return result;
  }, []);
}

/*
 * =========================================
 * Skill Relationships
 * =========================================
 */

export function createCertificationSkillRelationship(skill = {}, order = 0) {
  const skillId = getText(skill.skillId || skill.profileSkillId || skill.id);

  return {
    id: getText(skill.relationshipId) || createId("certification-skill"),

    skillId,

    order: Number.isInteger(skill.order) ? skill.order : order,

    snapshot: {
      name: getText(skill.snapshot?.name || skill.skillName || skill.name),

      category: getText(skill.snapshot?.category || skill.category),

      type: getText(skill.snapshot?.type || skill.type),

      proficiency: getText(
        skill.snapshot?.proficiency ||
          skill.proficiency?.level ||
          skill.proficiency,
      ),
    },
  };
}

function normalizeSkillRelationships(value) {
  const usedSkillIds = new Set();

  return getArray(value).reduce((relationships, relationship, index) => {
    const normalized = createCertificationSkillRelationship(
      relationship,
      index,
    );

    if (!normalized.skillId || usedSkillIds.has(normalized.skillId)) {
      return relationships;
    }

    usedSkillIds.add(normalized.skillId);

    relationships.push({
      ...normalized,
      order: relationships.length,
    });

    return relationships;
  }, []);
}

/*
 * =========================================
 * Training Relationships
 * =========================================
 */

export function createCertificationTrainingRelationship(
  training = {},
  order = 0,
) {
  const trainingId = getText(
    training.trainingId || training.trainingRecordId || training.id,
  );

  return {
    id: getText(training.relationshipId) || createId("certification-training"),

    trainingId,

    order: Number.isInteger(training.order) ? training.order : order,

    snapshot: {
      title: getText(
        training.snapshot?.title || training.trainingTitle || training.title,
      ),

      providerName: getText(
        training.snapshot?.providerName ||
          training.providerName ||
          training.provider?.name,
      ),

      completionStatus: getText(
        training.snapshot?.completionStatus ||
          training.completionStatus ||
          training.completion?.status,
      ),
    },
  };
}

function normalizeTrainingRelationships(value) {
  const usedTrainingIds = new Set();

  return getArray(value).reduce((relationships, relationship, index) => {
    const source =
      typeof relationship === "string"
        ? {
            trainingId: relationship,
          }
        : relationship;

    const normalized = createCertificationTrainingRelationship(source, index);

    if (!normalized.trainingId || usedTrainingIds.has(normalized.trainingId)) {
      return relationships;
    }

    usedTrainingIds.add(normalized.trainingId);

    relationships.push({
      ...normalized,
      order: relationships.length,
    });

    return relationships;
  }, []);
}

/*
 * =========================================
 * Supporting Documents
 * =========================================
 */

export function createCertificationDocument(document = {}, order = 0) {
  const timestamp = new Date().toISOString();

  const fileName = getText(document.fileName || document.originalName);

  return {
    id: getText(document.id) || createId("certification-document"),

    documentType: getOptionValue(
      CERTIFICATION_DOCUMENT_TYPE_OPTIONS,
      document.documentType || document.type,
      "certificate",
    ),

    name: getText(document.name || document.displayName || document.fileName),

    description: getText(document.description),

    fileName,

    extension:
      getText(document.extension).toLocaleLowerCase() ||
      getFileExtension(fileName),

    mimeType: getText(document.mimeType || document.fileType),

    size: Math.max(0, Number(document.size ?? document.fileSize) || 0),

    /*
     * The actual Blob is stored in IndexedDB.
     * Only the IndexedDB reference is stored here.
     */

    storageKey: getText(document.storageKey || document.documentKey),

    checksum: getText(document.checksum),

    /*
     * The primary document is used for the preview
     * shown on the Certification item.
     */

    isPrimary: getBoolean(document.isPrimary, false),

    previewMode: getCertificationDocumentPreviewMode({
      mimeType: document.mimeType || document.fileType,

      fileName,
    }),

    order: Number.isInteger(document.order) ? document.order : order,

    status: document.status === "archived" ? "archived" : "active",

    uploadedAt: getTimestamp(document.uploadedAt, timestamp),

    createdAt: getTimestamp(document.createdAt, timestamp),

    updatedAt: getTimestamp(document.updatedAt, timestamp),
  };
}

function normalizeDocuments(value) {
  const usedIds = new Set();

  const documents = getArray(value).reduce((result, document, index) => {
    if (!document || typeof document !== "object") {
      return result;
    }

    const normalized = createCertificationDocument(document, index);

    if (usedIds.has(normalized.id)) {
      return result;
    }

    usedIds.add(normalized.id);

    result.push({
      ...normalized,
      order: result.length,
    });

    return result;
  }, []);

  /*
   * Only one active document can be the primary
   * document used for the Certification item preview.
   */

  const requestedPrimaryIndex = documents.findIndex(
    (document) => document.isPrimary && document.status !== "archived",
  );

  const primaryIndex =
    requestedPrimaryIndex >= 0
      ? requestedPrimaryIndex
      : documents.findIndex((document) => document.status !== "archived");

  return documents.map((document, index) => ({
    ...document,
    isPrimary: index === primaryIndex,
  }));
}

/*
 * =========================================
 * Empty Certification
 * =========================================
 */

export function createEmptyCertification() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: CERTIFICATION_MODEL_VERSION,

    id: createId(),

    name: "",

    certificationType: "professional",

    issuingOrganization: {
      name: "",
      type: "other",
      website: "",
    },

    dates: {
      issueDate: "",
      expirationDate: "",
      lastRenewedDate: "",
      nextRenewalDate: "",
      doesNotExpire: false,
    },

    credential: {
      state: "active",
      credentialId: "",
      verificationUrl: "",
    },

    description: "",

    skillRelationships: [],

    relatedRecords: {
      trainingRelationships: [],
      educationIds: [],
    },

    supportingDocuments: [],

    visibility: {
      showIssuingOrganization: true,
      showIssuerWebsite: false,
      showDates: true,
      showExpirationDate: true,
      showCredentialId: false,
      showVerificationUrl: true,
      showDescription: true,
      showSkills: true,
      showSupportingDocuments: false,
    },

    privateInformation: {
      notes: "",
    },

    source: "manual",
    sourceContext: "certification-page",

    status: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Certification Normalization
 * =========================================
 */

export function normalizeCertification(value = {}) {
  const source = value && typeof value === "object" ? value : {};

  const empty = createEmptyCertification();

  const timestamp = new Date().toISOString();

  /*
   * Support both the new object structure and
   * older string-based issuing organizations.
   */

  const issuer =
    source.issuingOrganization && typeof source.issuingOrganization === "object"
      ? source.issuingOrganization
      : {
          name: source.issuingOrganization || source.issuer,
        };

  const dates =
    source.dates && typeof source.dates === "object" ? source.dates : {};

  const credential =
    source.credential && typeof source.credential === "object"
      ? source.credential
      : {};

  const related =
    source.relatedRecords && typeof source.relatedRecords === "object"
      ? source.relatedRecords
      : {};

  const visibility =
    source.visibility && typeof source.visibility === "object"
      ? source.visibility
      : {};

  const doesNotExpire = getBoolean(
    dates.doesNotExpire ?? source.doesNotExpire,
    false,
  );

  return {
    ...empty,

    modelVersion: CERTIFICATION_MODEL_VERSION,

    id: getText(source.id) || empty.id,

    name: getText(source.name || source.title),

    certificationType: getOptionValue(
      CERTIFICATION_TYPE_OPTIONS,
      source.certificationType || source.type,
      empty.certificationType,
    ),

    issuingOrganization: {
      name: getText(issuer.name),

      type: getOptionValue(
        CERTIFICATION_ISSUER_TYPE_OPTIONS,
        issuer.type,
        empty.issuingOrganization.type,
      ),

      website: getText(issuer.website),
    },

    dates: {
      issueDate: getMonth(dates.issueDate || source.issueDate),

      expirationDate: doesNotExpire
        ? ""
        : getMonth(dates.expirationDate || source.expirationDate),

      lastRenewedDate: getMonth(
        dates.lastRenewedDate || dates.renewalDate || source.renewalDate,
      ),

      nextRenewalDate: getMonth(dates.nextRenewalDate),

      doesNotExpire,
    },

    credential: {
      state: getOptionValue(
        CERTIFICATION_CREDENTIAL_STATE_OPTIONS,
        credential.state || source.credentialState,
        empty.credential.state,
      ),

      credentialId: getText(credential.credentialId || source.credentialId),

      verificationUrl: getText(
        credential.verificationUrl ||
          source.verificationUrl ||
          source.credentialUrl,
      ),
    },

    description: getText(source.description),

    skillRelationships: normalizeSkillRelationships(
      source.skillRelationships || source.skills,
    ),

    relatedRecords: {
      trainingRelationships: normalizeTrainingRelationships(
        related.trainingRelationships ||
          related.training ||
          related.trainingIds ||
          source.relatedTrainingRelationships ||
          source.relatedTrainingIds ||
          source.trainingIds,
      ),

      educationIds: uniqueTextValues(
        related.educationIds ||
          source.relatedEducationIds ||
          source.educationIds,
      ),
    },

    supportingDocuments: normalizeDocuments(
      source.supportingDocuments || source.documents,
    ),

    visibility: Object.keys(empty.visibility).reduce((result, key) => {
      result[key] = getBoolean(visibility[key], empty.visibility[key]);

      return result;
    }, {}),

    privateInformation: {
      notes: getText(source.privateInformation?.notes || source.privateNotes),
    },

    source: getOptionValue(
      CERTIFICATION_SOURCE_OPTIONS,
      source.source,
      empty.source,
    ),

    sourceContext: getText(source.sourceContext),

    status: getOptionValue(
      CERTIFICATION_STATUS_OPTIONS,
      source.status,
      empty.status,
    ),

    createdAt: getTimestamp(source.createdAt, timestamp),

    updatedAt: getTimestamp(source.updatedAt, timestamp),
  };
}

/*
 * =========================================
 * Collection Normalization
 * =========================================
 */

export function normalizeCertificationCollection(values = []) {
  const usedIds = new Set();

  return getArray(values).reduce((certifications, value) => {
    const certification = normalizeCertification(value);

    if (usedIds.has(certification.id)) {
      return certifications;
    }

    usedIds.add(certification.id);

    certifications.push(certification);

    return certifications;
  }, []);
}

/*
 * =========================================
 * Create and Update
 * =========================================
 */

export function createCertification(value = {}) {
  const timestamp = new Date().toISOString();

  return normalizeCertification({
    ...value,

    id: getText(value.id) || createId(),

    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function updateCertification(currentCertification, changes = {}) {
  return normalizeCertification({
    ...currentCertification,
    ...changes,

    id: currentCertification?.id,

    createdAt: currentCertification?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Display Helpers
 * =========================================
 */

export function getCertificationDisplayName(certification) {
  return getText(certification?.name) || "Untitled Certification";
}

export function getCertificationIssuerName(certification) {
  const issuer = certification?.issuingOrganization;

  return (
    getText(typeof issuer === "string" ? issuer : issuer?.name) ||
    "Issuing organization not provided"
  );
}

/*
 * =========================================
 * Related Training
 * =========================================
 */

export function getCertificationTrainingIds(certification) {
  return getArray(certification?.relatedRecords?.trainingRelationships)
    .map((relationship) => getText(relationship?.trainingId))
    .filter(Boolean);
}

/*
 * =========================================
 * Primary Certificate Document
 * =========================================
 */

export function getPrimaryCertificationDocument(certification) {
  const documents = getArray(certification?.supportingDocuments).filter(
    (document) => document?.status !== "archived",
  );

  return (
    documents.find((document) => document.isPrimary) || documents[0] || null
  );
}

/*
 * =========================================
 * Effective Credential State
 * =========================================
 */

export function getEffectiveCredentialState(certification, today = new Date()) {
  const normalized = normalizeCertification(certification);

  const todayMonth = today.toISOString().slice(0, 7);

  if (
    normalized.credential.state === "planned" ||
    (normalized.dates.issueDate && normalized.dates.issueDate > todayMonth)
  ) {
    return "planned";
  }

  if (
    !normalized.dates.doesNotExpire &&
    normalized.dates.expirationDate &&
    normalized.dates.expirationDate < todayMonth
  ) {
    return "expired";
  }

  return normalized.credential.state;
}

/*
 * =========================================
 * Public Output Boundary
 * =========================================
 *
 * Résumés, portfolios, and public exports should
 * receive only this sanitized structure.
 *
 * Private notes, source context, Training IDs,
 * Education IDs, and IndexedDB storage keys are
 * intentionally excluded.
 */

export function createPublicCertification(value = {}) {
  const certification = normalizeCertification(value);

  const { visibility } = certification;

  return {
    id: certification.id,

    name: certification.name,

    certificationType: certification.certificationType,

    credentialState: getEffectiveCredentialState(certification),

    issuingOrganization: visibility.showIssuingOrganization
      ? {
          name: certification.issuingOrganization.name,

          type: certification.issuingOrganization.type,

          website: visibility.showIssuerWebsite
            ? certification.issuingOrganization.website
            : "",
        }
      : null,

    dates: visibility.showDates
      ? {
          issueDate: certification.dates.issueDate,

          expirationDate: visibility.showExpirationDate
            ? certification.dates.expirationDate
            : "",

          lastRenewedDate: certification.dates.lastRenewedDate,

          nextRenewalDate: certification.dates.nextRenewalDate,

          doesNotExpire: certification.dates.doesNotExpire,
        }
      : null,

    credential: {
      credentialId: visibility.showCredentialId
        ? certification.credential.credentialId
        : "",

      verificationUrl: visibility.showVerificationUrl
        ? certification.credential.verificationUrl
        : "",
    },

    description: visibility.showDescription ? certification.description : "",

    skills: visibility.showSkills
      ? certification.skillRelationships.map((relationship) => ({
          skillId: relationship.skillId,

          name: relationship.snapshot.name,

          category: relationship.snapshot.category,

          type: relationship.snapshot.type,
        }))
      : [],

    supportingDocuments: visibility.showSupportingDocuments
      ? certification.supportingDocuments
          .filter((document) => document.status !== "archived")
          .map((document) => ({
            id: document.id,

            documentType: document.documentType,

            name: document.name,

            description: document.description,

            fileName: document.fileName,

            extension: document.extension,

            mimeType: document.mimeType,

            size: document.size,

            isPrimary: document.isPrimary,

            previewMode: document.previewMode,

            order: document.order,
          }))
      : [],
  };
}
