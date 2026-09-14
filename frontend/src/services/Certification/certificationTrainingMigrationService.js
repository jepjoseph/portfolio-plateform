import {
  CERTIFICATION_FIELD_LIMITS,
  isCertificationDocumentWithinSizeLimit,
  isSupportedCertificationDocument,
} from "../../config/certificationConfig.js";

import {
  createCertification as createCertificationModel,
  createCertificationDocument,
  createCertificationTrainingRelationship,
  normalizeCertification,
  normalizeCertificationCollection,
} from "../../models/certificationModel.js";

import {
  getTrainingCertificationIds,
  normalizeTrainingCollection,
} from "../../models/trainingModel.js";

import { getStoredDocumentFile } from "../Documents/documentStorage.js";

import { readStoredTraining } from "../Training/trainingStorage.js";

import {
  deleteCertificationDocuments,
  writeCertificationDocument,
} from "./certificationDocumentStorage.js";

import { readStoredCertifications } from "./certificationStorage.js";

import { saveCertificationWithTrainingSync } from "./certificationTrainingRelationshipService.js";

import { validateCertification } from "./certificationValidation.js";

/*
 * =========================================
 * Migration Configuration
 * =========================================
 */

export const CERTIFICATION_TRAINING_MIGRATION_KEY =
  "portfolio-platform:migrations:training-certifications";

export const CERTIFICATION_TRAINING_MIGRATION_VERSION = 1;

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeComparisonText(value) {
  return getText(value).normalize("NFKC").toLocaleLowerCase();
}

function uniqueTextValues(values) {
  return [...new Set(getArray(values).map(getText).filter(Boolean))];
}

/*
 * =========================================
 * Migration Storage
 * =========================================
 */

function getBrowserStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    const error = new Error(
      "Migration storage is unavailable in this environment.",
    );

    error.name = "CertificationTrainingMigrationError";
    error.code = "CERTIFICATION_TRAINING_MIGRATION_STORAGE_UNAVAILABLE";
    error.publicMessage =
      "Certification migration storage is not available in this browser.";

    throw error;
  }

  return window.localStorage;
}

function readMigrationState() {
  const storage = getBrowserStorage();

  const storedValue = storage.getItem(CERTIFICATION_TRAINING_MIGRATION_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    return parsedValue &&
      typeof parsedValue === "object" &&
      !Array.isArray(parsedValue)
      ? parsedValue
      : null;
  } catch {
    /*
     * An invalid marker should not permanently
     * prevent the migration from running.
     */

    return null;
  }
}

function writeMigrationState(report) {
  const storage = getBrowserStorage();

  const state = {
    version: CERTIFICATION_TRAINING_MIGRATION_VERSION,
    completedAt: new Date().toISOString(),

    summary: {
      examined: report.examined,
      eligible: report.eligible,
      created: report.created.length,
      linked: report.linked.length,
      skipped: report.skipped.length,
      documentCopies: report.documentCopies.length,
      documentFailures: report.documentFailures.length,
      failures: report.failures.length,
    },
  };

  storage.setItem(CERTIFICATION_TRAINING_MIGRATION_KEY, JSON.stringify(state));

  return state;
}

export function getCertificationTrainingMigrationState() {
  return readMigrationState();
}

export function clearCertificationTrainingMigrationState() {
  getBrowserStorage().removeItem(CERTIFICATION_TRAINING_MIGRATION_KEY);
}

/*
 * =========================================
 * Migration Errors
 * =========================================
 */

function createMigrationError({
  message,
  publicMessage,
  code = "CERTIFICATION_TRAINING_MIGRATION_FAILED",
  details = null,
  cause = null,
}) {
  const error = new Error(message);

  error.name = "CertificationTrainingMigrationError";
  error.code = code;
  error.status = 500;
  error.publicMessage = publicMessage;
  error.details = details;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/*
 * =========================================
 * Eligibility
 * =========================================
 */

function isCertificateDocument(document) {
  const documentType = normalizeComparisonText(document?.documentType);

  const searchableText = [
    document?.name,
    document?.fileName,
    document?.description,
  ]
    .map(normalizeComparisonText)
    .filter(Boolean)
    .join(" ");

  return (
    documentType.includes("certificate") ||
    documentType.includes("credential") ||
    searchableText.includes("certificate") ||
    searchableText.includes("credential")
  );
}

function getLegacyCertificateDocuments(training) {
  const documents = getArray(training?.supportingDocuments);

  const certificateDocuments = documents.filter(isCertificateDocument);

  if (certificateDocuments.length > 0) {
    return certificateDocuments.slice(
      0,
      CERTIFICATION_FIELD_LIMITS.maximumSupportingDocuments,
    );
  }

  /*
   * Older Training records may not have used a
   * certificate-specific document type.
   *
   * If a certificate was marked as earned and only
   * one document exists, it is a reasonable migration
   * candidate.
   */

  if (
    training?.completion?.certificateEarned === true &&
    documents.length === 1
  ) {
    return documents;
  }

  return [];
}

function hasLegacyCertificateInformation(training) {
  return Boolean(
    training?.completion?.certificateEarned === true ||
    getText(training?.completion?.credentialId) ||
    getText(training?.completion?.credentialUrl) ||
    getLegacyCertificateDocuments(training).length > 0,
  );
}

/*
 * =========================================
 * Matching Existing Certifications
 * =========================================
 */

function getCertificationCredentialId(certification) {
  return normalizeComparisonText(certification?.credential?.credentialId);
}

function getCertificationVerificationUrl(certification) {
  return normalizeComparisonText(certification?.credential?.verificationUrl);
}

function findMatchingCertification(certifications, training) {
  const trainingCredentialId = normalizeComparisonText(
    training?.completion?.credentialId,
  );

  const trainingCredentialUrl = normalizeComparisonText(
    training?.completion?.credentialUrl,
  );

  /*
   * Credential ID is the strongest match.
   */

  if (trainingCredentialId) {
    const credentialMatch = certifications.find(
      (certification) =>
        getCertificationCredentialId(certification) === trainingCredentialId,
    );

    if (credentialMatch) {
      return credentialMatch;
    }
  }

  /*
   * Verification URL is the next strongest match.
   */

  if (trainingCredentialUrl) {
    const urlMatch = certifications.find(
      (certification) =>
        getCertificationVerificationUrl(certification) ===
        trainingCredentialUrl,
    );

    if (urlMatch) {
      return urlMatch;
    }
  }

  /*
   * Fall back to Training title and provider name.
   */

  const trainingTitle = normalizeComparisonText(training?.title);

  const providerName = normalizeComparisonText(training?.provider?.name);

  if (!trainingTitle || !providerName) {
    return null;
  }

  return (
    certifications.find(
      (certification) =>
        normalizeComparisonText(certification?.name) === trainingTitle &&
        normalizeComparisonText(certification?.issuingOrganization?.name) ===
          providerName,
    ) || null
  );
}

/*
 * =========================================
 * Relationship Helpers
 * =========================================
 */

function getCertificationTrainingIds(certification) {
  return uniqueTextValues(
    getArray(certification?.relatedRecords?.trainingRelationships).map(
      (relationship) =>
        relationship?.trainingId || relationship?.trainingRecordId,
    ),
  );
}

function addTrainingRelationship(certification, training) {
  const currentRelationships = getArray(
    certification?.relatedRecords?.trainingRelationships,
  );

  const alreadyLinked = currentRelationships.some(
    (relationship) =>
      getText(relationship?.trainingId || relationship?.trainingRecordId) ===
      training.id,
  );

  if (alreadyLinked) {
    return certification;
  }

  if (
    currentRelationships.length >=
    CERTIFICATION_FIELD_LIMITS.maximumRelatedTrainingRecords
  ) {
    throw createMigrationError({
      message:
        `Certification "${certification.id}" cannot accept ` +
        `Training relationship "${training.id}".`,

      publicMessage:
        "A Certification reached its maximum number of linked Training records.",

      code: "CERTIFICATION_TRAINING_MIGRATION_RELATIONSHIP_LIMIT",

      details: {
        certificationId: certification.id,
        trainingId: training.id,
      },
    });
  }

  return normalizeCertification({
    ...certification,

    relatedRecords: {
      ...certification.relatedRecords,

      trainingRelationships: [
        ...currentRelationships,

        createCertificationTrainingRelationship(
          training,
          currentRelationships.length,
        ),
      ],
    },

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Certification Creation Data
 * =========================================
 */

function getCertificationIssueDate(training) {
  return (
    getText(training?.dates?.endDate) || getText(training?.dates?.startDate)
  );
}

function getCertificationDescription(training) {
  const description = getText(training?.description);

  if (description) {
    return description.slice(0, CERTIFICATION_FIELD_LIMITS.description);
  }

  const title = getText(training?.title) || "Training";

  return `Certification earned through ${title}.`.slice(
    0,
    CERTIFICATION_FIELD_LIMITS.description,
  );
}

function createCertificationFromTraining(training) {
  return createCertificationModel({
    name: getText(training?.title) || "Training Certification",

    certificationType: "professional",

    issuingOrganization: {
      name: getText(training?.provider?.name) || "Training Provider",

      type: "training-provider",

      website: getText(training?.provider?.website),
    },

    dates: {
      issueDate: getCertificationIssueDate(training),
      expirationDate: "",
      lastRenewedDate: "",
      nextRenewalDate: "",
      doesNotExpire: true,
    },

    credential: {
      state: "active",

      credentialId: getText(training?.completion?.credentialId),

      verificationUrl: getText(training?.completion?.credentialUrl),
    },

    description: getCertificationDescription(training),

    skillRelationships: [],

    relatedRecords: {
      trainingRelationships: [
        createCertificationTrainingRelationship(training, 0),
      ],

      educationIds: [],
    },

    supportingDocuments: [],

    visibility: {
      showIssuingOrganization: true,
      showIssuerWebsite: Boolean(getText(training?.provider?.website)),
      showDates: true,
      showExpirationDate: true,
      showCredentialId: Boolean(getText(training?.completion?.credentialId)),
      showVerificationUrl: Boolean(
        getText(training?.completion?.credentialUrl),
      ),
      showDescription: true,
      showSkills: true,
      showSupportingDocuments: false,
    },

    privateInformation: {
      notes: "",
    },

    source: "training",

    sourceContext: `Migrated from Training "${getText(
      training?.title,
    )}" (${training.id}).`.slice(0, CERTIFICATION_FIELD_LIMITS.sourceContext),

    status: training?.status === "archived" ? "archived" : "active",
  });
}

/*
 * =========================================
 * File Conversion
 * =========================================
 */

function createFileFromStoredValue(storedFile, document) {
  if (typeof File === "undefined") {
    return null;
  }

  if (storedFile instanceof File) {
    return storedFile;
  }

  if (typeof Blob !== "undefined" && storedFile instanceof Blob) {
    return new File(
      [storedFile],
      getText(document?.fileName) ||
        getText(document?.name) ||
        "certificate-document",
      {
        type:
          getText(document?.mimeType) ||
          storedFile.type ||
          "application/octet-stream",

        lastModified: Date.now(),
      },
    );
  }

  return null;
}

async function copyTrainingCertificateDocuments(
  training,
  certification,
  report,
) {
  const copiedDocuments = [];
  const copiedStorageKeys = [];

  const legacyDocuments = getLegacyCertificateDocuments(training);

  for (const legacyDocument of legacyDocuments) {
    const originalStorageKey = getText(legacyDocument?.storageKey);

    if (!originalStorageKey) {
      report.documentFailures.push({
        trainingId: training.id,
        certificationId: certification.id,
        documentId: getText(legacyDocument?.id),
        fileName: getText(legacyDocument?.fileName),
        reason: "The Training document has no storage key.",
      });

      continue;
    }

    try {
      const storedValue = await getStoredDocumentFile(originalStorageKey);

      const file = createFileFromStoredValue(storedValue, legacyDocument);

      if (!file) {
        throw new Error("The Training document file is unavailable.");
      }

      if (!isSupportedCertificationDocument(file)) {
        throw new Error(
          "The Training document format is not supported by Certification storage.",
        );
      }

      if (!isCertificationDocumentWithinSizeLimit(file)) {
        throw new Error(
          "The Training document exceeds the Certification file-size limit.",
        );
      }

      const storedDocument = await writeCertificationDocument({
        file,
        certificationId: certification.id,
      });

      copiedStorageKeys.push(storedDocument.storageKey);

      const copiedDocument = createCertificationDocument(
        {
          id: storedDocument.documentId,

          documentType: "certificate",

          name:
            getText(legacyDocument?.name) ||
            getText(certification?.name) ||
            storedDocument.fileName,

          description:
            getText(legacyDocument?.description) ||
            "Certificate migrated from the Training Library.",

          fileName: storedDocument.fileName,
          extension: storedDocument.extension,
          mimeType: storedDocument.mimeType,
          size: storedDocument.size,
          storageKey: storedDocument.storageKey,
          previewMode: storedDocument.previewMode,

          isPrimary: copiedDocuments.length === 0,

          status: "active",

          uploadedAt:
            getText(legacyDocument?.uploadedAt) || storedDocument.updatedAt,

          createdAt: storedDocument.createdAt,
          updatedAt: storedDocument.updatedAt,
        },
        copiedDocuments.length,
      );

      copiedDocuments.push(copiedDocument);

      report.documentCopies.push({
        trainingId: training.id,
        certificationId: certification.id,
        sourceDocumentId: getText(legacyDocument?.id),
        sourceStorageKey: originalStorageKey,
        certificationStorageKey: storedDocument.storageKey,
        fileName: storedDocument.fileName,
      });
    } catch (error) {
      report.documentFailures.push({
        trainingId: training.id,
        certificationId: certification.id,
        documentId: getText(legacyDocument?.id),
        fileName: getText(legacyDocument?.fileName),
        reason:
          error?.publicMessage ||
          error?.message ||
          "The document could not be migrated.",
      });
    }
  }

  return {
    certification: normalizeCertification({
      ...certification,

      supportingDocuments: copiedDocuments,

      visibility: {
        ...certification.visibility,

        showSupportingDocuments: copiedDocuments.length > 0,
      },
    }),

    copiedStorageKeys,
  };
}

/*
 * =========================================
 * Report
 * =========================================
 */

function createMigrationReport() {
  return {
    version: CERTIFICATION_TRAINING_MIGRATION_VERSION,

    alreadyCompleted: false,

    examined: 0,

    eligible: 0,

    created: [],

    linked: [],

    skipped: [],

    documentCopies: [],

    documentFailures: [],

    failures: [],

    completedAt: "",
  };
}

/*
 * =========================================
 * Main Migration
 * =========================================
 */

export async function migrateLegacyTrainingCertifications({
  force = false,
} = {}) {
  const previousState = readMigrationState();

  if (
    !force &&
    Number(previousState?.version) >= CERTIFICATION_TRAINING_MIGRATION_VERSION
  ) {
    return {
      ...createMigrationReport(),

      alreadyCompleted: true,

      completedAt: getText(previousState?.completedAt),

      previousState,
    };
  }

  const report = createMigrationReport();

  const originalTrainingRecords =
    normalizeTrainingCollection(readStoredTraining());

  const originalCertificationRecords = normalizeCertificationCollection(
    readStoredCertifications(),
  );

  report.examined = originalTrainingRecords.length;

  const eligibleTrainingRecords = originalTrainingRecords.filter(
    hasLegacyCertificateInformation,
  );

  report.eligible = eligibleTrainingRecords.length;

  let nextCertificationRecords = [...originalCertificationRecords];

  const changedCertificationIds = new Set();

  const copiedStorageKeys = [];

  try {
    for (const training of eligibleTrainingRecords) {
      const recordCopiedStorageKeyStart = copiedStorageKeys.length;
      try {
        const linkedCertificationIds = getTrainingCertificationIds(training);

        /*
         * This Training has already been migrated or
         * manually linked. Do not create another record.
         */

        if (linkedCertificationIds.length > 0) {
          report.skipped.push({
            trainingId: training.id,
            reason: "Training already has a Certification relationship.",
            certificationIds: linkedCertificationIds,
          });

          continue;
        }

        let certification = findMatchingCertification(
          nextCertificationRecords,
          training,
        );

        if (certification) {
          certification = addTrainingRelationship(certification, training);

          nextCertificationRecords = nextCertificationRecords.map((record) =>
            record.id === certification.id ? certification : record,
          );

          changedCertificationIds.add(certification.id);

          report.linked.push({
            trainingId: training.id,
            certificationId: certification.id,
            created: false,
          });

          continue;
        }

        certification = createCertificationFromTraining(training);

        const copied = await copyTrainingCertificateDocuments(
          training,
          certification,
          report,
        );

        certification = copied.certification;

        copiedStorageKeys.push(...copied.copiedStorageKeys);

        const validation = validateCertification(certification, {
          trainingRecords: originalTrainingRecords,
        });

        if (!validation.isValid) {
          throw createMigrationError({
            message:
              `Migrated Certification for Training ` +
              `"${training.id}" did not pass validation.`,

            publicMessage:
              "A legacy Training certificate could not be converted.",

            code: "CERTIFICATION_TRAINING_MIGRATION_VALIDATION_FAILED",

            details: {
              trainingId: training.id,
              validation,
            },
          });
        }

        certification = validation.certification;

        nextCertificationRecords.push(certification);

        changedCertificationIds.add(certification.id);

        report.created.push({
          trainingId: training.id,
          certificationId: certification.id,
          name: certification.name,
        });

        report.linked.push({
          trainingId: training.id,
          certificationId: certification.id,
          created: true,
        });
      } catch (recordError) {
        report.failures.push({
          trainingId: training.id,

          message:
            recordError?.publicMessage ||
            recordError?.message ||
            "The Training certificate could not be migrated.",

          code:
            recordError?.code ||
            "CERTIFICATION_TRAINING_RECORD_MIGRATION_FAILED",
        });
      }
    }

    /*
     * Even if no new Certification was needed, write the
     * migration marker so the scan is not repeated.
     */

    if (changedCertificationIds.size > 0) {
      saveCertificationWithTrainingSync({
        certificationRecords: normalizeCertificationCollection(
          nextCertificationRecords,
        ),

        changedCertificationIds: [...changedCertificationIds],
      });
    }

    report.completedAt = new Date().toISOString();

    writeMigrationState(report);

    return report;
  } catch (recordError) {
    const recordStorageKeys = copiedStorageKeys.splice(
      recordCopiedStorageKeyStart,
    );

    if (recordStorageKeys.length > 0) {
      await deleteCertificationDocuments(recordStorageKeys).catch(() => {});
    }

    report.failures.push({
      trainingId: training.id,

      message:
        recordError?.publicMessage ||
        recordError?.message ||
        "The Training certificate could not be migrated.",

      code:
        recordError?.code || "CERTIFICATION_TRAINING_RECORD_MIGRATION_FAILED",
    });
  }
}
