import { apiGet, apiPatch } from "../apiClient.js";

const CERTIFICATIONS_ENDPOINT = "/certifications";

function certificationPath(certificationId) {
  if (
    typeof certificationId !== "string" ||
    !certificationId.trim() ||
    certificationId.trim().length > 200
  ) {
    throw new TypeError("A valid Certification ID is required.");
  }

  return `${CERTIFICATIONS_ENDPOINT}/${encodeURIComponent(
    certificationId.trim(),
  )}`;
}

function documentPath(certificationId, documentId) {
  if (
    typeof documentId !== "string" ||
    !documentId.trim() ||
    documentId.trim().length > 200
  ) {
    throw new TypeError("A valid Certification Document ID is required.");
  }

  return `${certificationPath(certificationId)}/documents/${encodeURIComponent(
    documentId.trim(),
  )}`;
}

export async function fetchCertifications(options = {}) {
  const response = await apiGet(CERTIFICATIONS_ENDPOINT, options);
  return response.data.certifications;
}

export async function fetchCertificationById(
  certificationId,
  options = {},
) {
  const response = await apiGet(
    certificationPath(certificationId),
    options,
  );

  return response.data.certification;
}

export async function fetchCertificationDocuments(
  certificationId,
  options = {},
) {
  const response = await apiGet(
    `${certificationPath(certificationId)}/documents`,
    options,
  );

  return response.data.documents;
}

export function getCertificationDocumentEndpoint(
  certificationId,
  documentId,
) {
  return documentPath(certificationId, documentId);
}

/*
 * =========================================
 * Update Certification Metadata
 * =========================================
 */
export async function patchCertification(
  certificationId,
  updates,
  rowVersion,
  options = {},
) {
  if (
    typeof rowVersion !== "string" ||
    !/^[A-Za-z0-9+/]{11}=$/.test(rowVersion)
  ) {
    throw new TypeError("A valid Certification rowVersion is required.");
  }

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    throw new TypeError("Certification updates must be an object.");
  }

  const response = await apiPatch(
    certificationPath(certificationId),
    {
      updates,
      rowVersion,
    },
    options,
  );

  return response.data.certification;
}
