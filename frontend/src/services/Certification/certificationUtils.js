import {
  getCertificationCredentialStateLabel,
  getCertificationDocumentTypeLabel,
  getCertificationIssuerTypeLabel,
  getCertificationSourceLabel,
  getCertificationStatusLabel,
  getCertificationTypeLabel,
} from "../../config/certificationConfig.js";

import {
  getCertificationDisplayName,
  getCertificationIssuerName,
  getEffectiveCredentialState,
  getPrimaryCertificationDocument,
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

function compareText(firstValue, secondValue) {
  return getText(firstValue).localeCompare(getText(secondValue), undefined, {
    sensitivity: "base",
  });
}

function normalizeSearchValue(value) {
  return getText(value).normalize("NFKC").toLocaleLowerCase();
}

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getMonthTimestamp(value, fallback = 0) {
  const month = getText(value);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return fallback;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  return Date.UTC(year, monthNumber - 1, 1);
}

/*
 * =========================================
 * Active and Archived
 * =========================================
 */

export function isActiveCertification(certification) {
  return certification?.status !== "archived";
}

export function isArchivedCertification(certification) {
  return certification?.status === "archived";
}

export function getActiveCertifications(certifications = []) {
  return getArray(certifications).filter(isActiveCertification);
}

export function getArchivedCertifications(certifications = []) {
  return getArray(certifications).filter(isArchivedCertification);
}

/*
 * =========================================
 * Display Information
 * =========================================
 */

export function getCertificationPrimaryLabel(certification) {
  return getCertificationDisplayName(certification);
}

export function getCertificationSecondaryLabel(certification) {
  return getCertificationIssuerName(certification);
}

export function getCertificationTypeDisplay(certification) {
  return getCertificationTypeLabel(certification?.certificationType);
}

export function getCertificationIssuerTypeDisplay(certification) {
  return getCertificationIssuerTypeLabel(
    certification?.issuingOrganization?.type,
  );
}

export function getCertificationCredentialState(certification) {
  return getEffectiveCredentialState(certification);
}

export function getCertificationCredentialStateDisplay(certification) {
  return getCertificationCredentialStateLabel(
    getCertificationCredentialState(certification),
  );
}

export function getCertificationSourceDisplay(certification) {
  return getCertificationSourceLabel(certification?.source);
}

export function getCertificationStatusDisplay(certification) {
  return getCertificationStatusLabel(certification?.status);
}

/*
 * =========================================
 * Date Formatting
 * =========================================
 */

export function formatCertificationDate(
  value,
  { locale = "en-US", fallback = "" } = {},
) {
  const normalizedValue = getText(value);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(normalizedValue)) {
    return fallback;
  }

  const [year, month] = normalizedValue.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getCertificationDateRange(certification, options = {}) {
  const issueDate = formatCertificationDate(
    certification?.dates?.issueDate,
    options,
  );

  if (certification?.dates?.doesNotExpire && issueDate) {
    return `Issued ${issueDate} · No expiration`;
  }

  const expirationDate = formatCertificationDate(
    certification?.dates?.expirationDate,
    options,
  );

  if (issueDate && expirationDate) {
    return `Issued ${issueDate} · ` + `Expires ${expirationDate}`;
  }

  if (issueDate) {
    return `Issued ${issueDate}`;
  }

  if (expirationDate) {
    return `Expires ${expirationDate}`;
  }

  return "";
}

/*
 * =========================================
 * Metadata
 * =========================================
 */

export function getCertificationMetadata(certification) {
  const metadata = [
    getCertificationTypeDisplay(certification),

    getCertificationCredentialStateDisplay(certification),

    getCertificationDateRange(certification),
  ];

  if (certification?.credential?.credentialId) {
    metadata.push(`Credential ID: ${certification.credential.credentialId}`);
  }

  return metadata.filter(Boolean);
}

/*
 * =========================================
 * Primary Document
 * =========================================
 */

export function getPrimaryCertificationDocumentInfo(certification) {
  const document = getPrimaryCertificationDocument(certification);

  if (!document) {
    return null;
  }

  return {
    ...document,

    typeLabel: getCertificationDocumentTypeLabel(document.documentType),

    canPreview:
      document.previewMode === "image" || document.previewMode === "pdf",

    requiresDownload:
      document.previewMode === "word" || document.previewMode === "document",
  };
}

export function hasCertificationDocument(certification) {
  return Boolean(getPrimaryCertificationDocument(certification));
}

/*
 * =========================================
 * Training Relationships
 * =========================================
 */

export function getCertificationTrainingRelationships(certification) {
  return getArray(certification?.relatedRecords?.trainingRelationships);
}

export function getCertificationTrainingSummary(certification) {
  const relationships = getCertificationTrainingRelationships(certification);

  if (relationships.length === 0) {
    return "No linked Training records";
  }

  if (relationships.length === 1) {
    const relationship = relationships[0];

    return getText(relationship?.snapshot?.title) || "1 linked Training record";
  }

  return `${relationships.length} linked Training records`;
}

/*
 * =========================================
 * Search
 * =========================================
 */

export function createCertificationSearchText(certification) {
  const trainingRelationships =
    getCertificationTrainingRelationships(certification);

  return [
    certification?.name,

    certification?.description,

    certification?.certificationType,

    certification?.credential?.state,

    certification?.credential?.credentialId,

    certification?.issuingOrganization?.name,

    certification?.issuingOrganization?.type,

    certification?.source,

    certification?.sourceContext,

    certification?.privateInformation?.notes,

    getCertificationTypeDisplay(certification),

    getCertificationIssuerTypeDisplay(certification),

    getCertificationCredentialStateDisplay(certification),

    ...getArray(certification?.skillRelationships).flatMap((relationship) => [
      relationship?.snapshot?.name,
      relationship?.snapshot?.category,
      relationship?.snapshot?.type,
    ]),

    ...trainingRelationships.flatMap((relationship) => [
      relationship?.snapshot?.title,

      relationship?.snapshot?.providerName,

      relationship?.snapshot?.completionStatus,
    ]),

    ...getArray(certification?.supportingDocuments).flatMap((document) => [
      document?.name,
      document?.fileName,
      document?.documentType,
    ]),
  ]
    .map(getText)
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

export function searchCertifications(certifications = [], query = "") {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return [...getArray(certifications)];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return getArray(certifications).filter((certification) => {
    const searchText = createCertificationSearchText(certification);

    return terms.every((term) => searchText.includes(term));
  });
}

/*
 * =========================================
 * Filtering
 * =========================================
 */

export function filterCertifications(certifications = [], filters = {}) {
  const {
    type = "all",
    credentialState = "all",
    issuerType = "all",
    source = "all",
    status = "all",
    document = "all",
    training = "all",
  } = filters;

  return getArray(certifications).filter((certification) => {
    if (type !== "all" && certification?.certificationType !== type) {
      return false;
    }

    if (
      credentialState !== "all" &&
      getCertificationCredentialState(certification) !== credentialState
    ) {
      return false;
    }

    if (
      issuerType !== "all" &&
      certification?.issuingOrganization?.type !== issuerType
    ) {
      return false;
    }

    if (source !== "all" && certification?.source !== source) {
      return false;
    }

    if (status !== "all" && certification?.status !== status) {
      return false;
    }

    const hasDocument = hasCertificationDocument(certification);

    if (document === "with-document" && !hasDocument) {
      return false;
    }

    if (document === "without-document" && hasDocument) {
      return false;
    }

    const hasTraining =
      getCertificationTrainingRelationships(certification).length > 0;

    if (training === "linked" && !hasTraining) {
      return false;
    }

    if (training === "not-linked" && hasTraining) {
      return false;
    }

    return true;
  });
}

/*
 * =========================================
 * Sorting
 * =========================================
 */

export function sortCertifications(
  certifications = [],
  sortOption = "name-ascending",
) {
  const sorted = [...getArray(certifications)];

  sorted.sort((firstCertification, secondCertification) => {
    switch (sortOption) {
      case "name-descending":
        return compareText(secondCertification?.name, firstCertification?.name);

      case "issuer-ascending":
        return (
          compareText(
            firstCertification?.issuingOrganization?.name,

            secondCertification?.issuingOrganization?.name,
          ) || compareText(firstCertification?.name, secondCertification?.name)
        );

      case "issue-newest":
        return (
          getMonthTimestamp(secondCertification?.dates?.issueDate) -
            getMonthTimestamp(firstCertification?.dates?.issueDate) ||
          compareText(firstCertification?.name, secondCertification?.name)
        );

      case "expiration-soonest": {
        const firstExpiration = firstCertification?.dates?.doesNotExpire
          ? Number.POSITIVE_INFINITY
          : getMonthTimestamp(
              firstCertification?.dates?.expirationDate,

              Number.POSITIVE_INFINITY,
            );

        const secondExpiration = secondCertification?.dates?.doesNotExpire
          ? Number.POSITIVE_INFINITY
          : getMonthTimestamp(
              secondCertification?.dates?.expirationDate,

              Number.POSITIVE_INFINITY,
            );

        return (
          firstExpiration - secondExpiration ||
          compareText(firstCertification?.name, secondCertification?.name)
        );
      }

      case "recently-created":
        return (
          getTimestamp(secondCertification?.createdAt) -
            getTimestamp(firstCertification?.createdAt) ||
          compareText(firstCertification?.name, secondCertification?.name)
        );

      case "recently-updated":
        return (
          getTimestamp(secondCertification?.updatedAt) -
            getTimestamp(firstCertification?.updatedAt) ||
          compareText(firstCertification?.name, secondCertification?.name)
        );

      case "name-ascending":
      default:
        return compareText(firstCertification?.name, secondCertification?.name);
    }
  });

  return sorted;
}

/*
 * =========================================
 * Prepared Collection
 * =========================================
 */

export function prepareCertificationCollection({
  certifications = [],
  query = "",
  filters = {},
  sortOption = "name-ascending",
} = {}) {
  return sortCertifications(
    filterCertifications(searchCertifications(certifications, query), filters),
    sortOption,
  );
}

/*
 * =========================================
 * Statistics
 * =========================================
 */

export function getCertificationStatistics(certifications = []) {
  const collection = getArray(certifications);

  const activeRecords = getActiveCertifications(collection);

  const archivedRecords = getArchivedCertifications(collection);

  const credentialStates = activeRecords.reduce(
    (states, certification) => {
      const state = getCertificationCredentialState(certification);

      if (state in states) {
        states[state] += 1;
      }

      return states;
    },
    {
      active: 0,
      expired: 0,
      planned: 0,
    },
  );

  return {
    total: collection.length,

    activeRecords: activeRecords.length,

    archivedRecords: archivedRecords.length,

    activeCredentials: credentialStates.active,

    expiredCredentials: credentialStates.expired,

    plannedCredentials: credentialStates.planned,

    withDocuments: activeRecords.filter(hasCertificationDocument).length,

    withoutDocuments: activeRecords.filter(
      (certification) => !hasCertificationDocument(certification),
    ).length,

    linkedToTraining: activeRecords.filter(
      (certification) =>
        getCertificationTrainingRelationships(certification).length > 0,
    ).length,

    withSkills: activeRecords.filter(
      (certification) => getArray(certification.skillRelationships).length > 0,
    ).length,

    issuerCount: new Set(
      activeRecords
        .map((certification) =>
          normalizeSearchValue(certification.issuingOrganization?.name),
        )
        .filter(Boolean),
    ).size,
  };
}
