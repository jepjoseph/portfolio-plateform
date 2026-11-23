import { createEmptyEducation } from "../../models/educationModel.js";
import { validateEducation } from "./educationValidation.js";
import {
  fetchEducationRecords, fetchEducationRecord, createEducationRecord,
  patchEducationRecord, fetchEducationDocuments, deleteEducationRecord,
} from "./educationApiService.js";

const prohibited = ["supportingDocuments", "documentLinks", "certificationDocumentLinks",
  "relatedCertificationIds", "relatedTrainingIds", "relatedProjectIds", "skillRelationships",
  "userId", "user_id", "rowVersion", "createdAt", "updatedAt"];

function writable(record, creating = false) {
  const result = { ...record };
  for (const key of prohibited) delete result[key];
  if (!creating) { delete result.id; delete result.modelVersion; }
  if (creating) delete result.recordStatus;
  return result;
}

function displayDocument(document, index) {
  return {
    id: document.id, name: document.name || document.originalFileName || document.fileName || "Document",
    fileName: document.originalFileName || document.fileName || document.name || "Document.pdf",
    fileSize: Number(document.fileSize ?? document.sizeBytes ?? 0),
    mimeType: "application/pdf", documentType: document.documentType || "other",
    visibility: document.visibility || "private", description: document.description || "",
    storageProvider: "education-api", storageKey: "", fileUrl: "education-api-document",
    uploadedAt: document.uploadedAt || document.createdAt || "", order: index,
  };
}

async function hydrate(record) {
  if (!record?.id) throw new Error("Invalid Education API record.");
  const { ownedDocuments, linkedDocuments } = await fetchEducationDocuments(record.id);
  const owned = ownedDocuments.map(displayDocument);
  // Linked documents require their own source-specific download endpoint.
  // Do not misrepresent them as owned files.
  return {
    ...record, status: record.recordStatus || record.status || "active",
    supportingDocuments: owned,
    linkedEducationDocuments: linkedDocuments,
  };
}

export async function getEducationRecords({ includeArchived = false } = {}) {
  const records = await fetchEducationRecords();
  const hydrated = await Promise.all(records.map(hydrate));
  return includeArchived ? hydrated : hydrated.filter((item) => item.status !== "archived");
}
export const getEducation = getEducationRecords;
export async function getEducationById(educationId) {
  return hydrate(await fetchEducationRecord(educationId));
}
export async function createEducation(educationData) {
  if (educationData?.supportingDocuments?.length) {
    throw new Error("Save the Education record without documents first. PDF upload will be enabled in the document integration stage.");
  }
  if (educationData?.skillRelationships?.length || educationData?.relatedCertificationIds?.length ||
      educationData?.relatedTrainingIds?.length || educationData?.relatedProjectIds?.length) {
    throw new Error("Education relationship editing is not yet enabled for SQL. Remove pending relationship changes before saving.");
  }
  return hydrate(await createEducationRecord(writable(educationData, true)));
}
export async function updateEducation(educationId, updates = {}) {
  const current = await fetchEducationRecord(educationId);
  if (!current.rowVersion) throw new Error("Missing SQL rowVersion. Reload Education before saving.");
  if (updates.supportingDocuments?.some((doc) => doc.storageProvider !== "education-api")) {
    throw new Error("PDF changes must be saved through the Education document API.");
  }
  for (const key of ["skillRelationships", "relatedCertificationIds", "relatedTrainingIds", "relatedProjectIds"]) {
    if (JSON.stringify(updates[key] ?? []) !== JSON.stringify(current[key] ?? [])) {
      throw new Error(`Changes to ${key} require a dedicated backend endpoint and cannot be saved here.`);
    }
  }
  const changes = writable(updates);
  changes.recordStatus = updates.status === "archived" ? "archived" : "active";
  delete changes.status;
  return hydrate(await patchEducationRecord(educationId, changes, current.rowVersion));
}
export async function archiveEducation(educationId) {
  return updateEducation(educationId, { recordStatus: "archived", status: "archived" });
}
export async function restoreEducation(educationId) {
  return updateEducation(educationId, { recordStatus: "active", status: "active" });
}
export async function deleteEducation(educationId) {
  const current = await fetchEducationRecord(educationId);
  if (!current.rowVersion) throw new Error("Missing SQL rowVersion. Reload Education before deleting.");
  const { ownedDocuments, linkedDocuments } = await fetchEducationDocuments(educationId);
  if (ownedDocuments.length || linkedDocuments.length) {
    throw new Error("Remove Education-owned PDFs and unlink Certification documents before deleting this record.");
  }
  return deleteEducationRecord(educationId, current.rowVersion);
}
export async function replaceEducationRecords() {
  throw new Error("Bulk replacement is disabled for SQL-backed Education records.");
}
export async function validateEducationDraft(educationData) {
  return validateEducation({ ...createEmptyEducation(), ...educationData });
}