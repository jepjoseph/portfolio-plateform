import { API_BASE_URL } from "../apiClient.js";

function id(value, label = "identifier") {
  if (typeof value !== "string" || !value.trim() || value.length > 200) {
    throw new TypeError(`A valid ${label} is required.`);
  }
  return encodeURIComponent(value.trim());
}

const educationPath = (educationId) => `/educations/${id(educationId, "Education ID")}`;

async function request(path, { method = "GET", body, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, credentials: "include", cache: "no-store", headers, signal,
    ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || `Education API request failed (HTTP ${response.status}).`);
    error.status = response.status;
    error.code = payload?.code || "EDUCATION_API_FAILED";
    error.details = payload?.details || null;
    throw error;
  }
  if (!payload?.data || typeof payload.data !== "object") throw new Error("Education API returned an invalid response.");
  return payload.data;
}

export async function fetchEducationRecords(options = {}) {
  const data = await request("/educations", options);
  if (!Array.isArray(data.educations)) throw new Error("Education list response is invalid.");
  return data.educations;
}

export async function fetchEducationRecord(educationId, options = {}) {
  const data = await request(educationPath(educationId), options);
  if (!data.education) throw new Error("Education record response is invalid.");
  return data.education;
}

export async function createEducationRecord(record, options = {}) {
  const data = await request("/educations", { ...options, method: "POST", body: record });
  if (!data.education) throw new Error("Education creation response is invalid.");
  return data.education;
}

export async function patchEducationRecord(educationId, updates, rowVersion, options = {}) {
  if (typeof rowVersion !== "string" || !rowVersion.trim()) throw new Error("Education rowVersion is required. Reload the record before saving.");
  const data = await request(educationPath(educationId), {
    ...options, method: "PATCH", body: { updates, rowVersion },
  });
  if (!data.education) throw new Error("Education update response is invalid.");
  return data.education;
}

export async function fetchEducationDocuments(educationId, options = {}) {
  const data = await request(`${educationPath(educationId)}/documents`, options);
  if (!Array.isArray(data.ownedDocuments) || !Array.isArray(data.linkedDocuments)) {
    throw new Error("Education documents response is invalid.");
  }
  return data;
}

export async function uploadEducationPdf(educationId, file, options = {}) {
  if (!(file instanceof Blob) || file.size < 1 || file.size > 15 * 1024 * 1024 ||
      !/\.pdf$/i.test(file.name || "") || (file.type && file.type !== "application/pdf")) {
    throw new TypeError("Select a nonempty PDF no larger than 15 MiB.");
  }
  const body = new FormData();
  body.set("file", file);
  const data = await request(`${educationPath(educationId)}/documents`, { ...options, method: "POST", body });
  if (!data.document) throw new Error("Education PDF upload response is invalid.");
  return data.document;
}

export async function deleteEducationPdf(educationId, documentId, options = {}) {
  return request(`${educationPath(educationId)}/documents/${id(documentId, "Document ID")}`, {
    ...options, method: "DELETE",
  });
}

export async function loadEducationPdf(educationId, documentId, { download = false, signal } = {}) {
  const path = `${educationPath(educationId)}/documents/${id(documentId, "Document ID")}/file${download ? "?download=1" : ""}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", cache: "no-store", headers: { Accept: "application/pdf" }, signal,
  });
  if (!response.ok) throw new Error(`Unable to retrieve Education PDF (HTTP ${response.status}).`);
  const blob = await response.blob();
  if (!/^application\/pdf(?:;|$)/i.test(blob.type)) throw new Error("The server did not return a PDF.");
  return blob;
}

export async function linkEducationCertificationPdf(educationId, certificationDocumentId, options = {}) {
  const data = await request(`${educationPath(educationId)}/document-links`, {
    ...options, method: "POST", body: { certificationDocumentId },
  });
  if (!data.link) throw new Error("Education document link response is invalid.");
  return data.link;
}

export async function unlinkEducationCertificationPdf(educationId, linkId, options = {}) {
  return request(`${educationPath(educationId)}/document-links/${id(linkId, "Link ID")}`, {
    ...options, method: "DELETE",
  });
}
export async function deleteEducationRecord(educationId, rowVersion) {
  if (typeof rowVersion !== "string" || !rowVersion.trim()) {
    throw new Error("Education rowVersion is required. Reload before deleting.");
  }
  return request(educationPath(educationId), {
    method: "DELETE", body: { rowVersion }
  });
}