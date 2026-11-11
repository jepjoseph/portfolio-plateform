import { apiGet, apiPost, apiDelete, API_BASE_URL, ApiError, AUTH_SESSION_INVALID_EVENT } from "../apiClient.js";

function identifier(value, label) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 200) throw new TypeError(`A valid ${label} is required.`);
  return encodeURIComponent(value.trim());
}
function documentsPath(trainingId) { return `/trainings/${identifier(trainingId, "Training ID")}/documents`; }
function requireVersion(training) {
  if (!training?.id || typeof training.rowVersion !== "string" || !/^[A-Za-z0-9+/]{11}=$/.test(training.rowVersion)) {
    throw new TypeError("Save the Training first, then reopen Edit to manage its PDFs.");
  }
}
function mutationResult(response, trainingId) {
  const result = response?.data;
  if (!result?.training || result.training.id !== trainingId || !Array.isArray(result.training.supportingDocuments)) {
    throw new TypeError("The server response was incomplete. Reopen Edit to reload the Training before trying again.");
  }
  requireVersion(result.training);
  return result;
}
export async function fetchTrainingDocuments(trainingId, options = {}) {
  const response = await apiGet(documentsPath(trainingId), options);
  if (!Array.isArray(response?.data?.documents)) throw new TypeError("Invalid Training document response.");
  return response.data.documents;
}
export async function uploadTrainingDocument(training, file, details = {}, options = {}) {
  requireVersion(training);
  if (!(file instanceof Blob) || !file.size || file.size > 15 * 1024 * 1024 || !/\.pdf$/i.test(file.name || "") || (file.type && file.type !== "application/pdf")) {
    throw new TypeError("Select a nonempty PDF no larger than 15 MiB.");
  }
  const body = new FormData();
  body.set("file", file);
  body.set("rowVersion", training.rowVersion);
  body.set("name", details.name || file.name);
  body.set("documentType", details.documentType || "other");
  body.set("description", details.description || "");
  body.set("visibility", details.visibility || "private");
  return mutationResult(await apiPost(documentsPath(training.id), body, { timeoutMs: 60000, ...options }), training.id);
}
export async function deleteTrainingDocument(training, documentId, options = {}) {
  requireVersion(training);
  const endpoint = `${documentsPath(training.id)}/${identifier(documentId, "Document ID")}`;
  return mutationResult(await apiDelete(endpoint, { ...options, body: { rowVersion: training.rowVersion } }), training.id);
}
export function mergeTrainingDocumentResult(draft, saved) {
  if (!draft?.id || draft.id !== saved?.id || !Array.isArray(saved.supportingDocuments)) throw new TypeError("Training identity mismatch.");
  // Preserve all unsaved editable fields. Only the dedicated operation owns this array.
  return { ...draft, supportingDocuments: saved.supportingDocuments, rowVersion: saved.rowVersion };
}
export async function loadTrainingPdf(trainingId, documentId, { signal } = {}) {
  const endpoint = `${documentsPath(trainingId)}/${identifier(documentId, "Document ID")}/download`;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET", credentials: "include", cache: "no-store", signal, headers: { Accept: "application/pdf" },
  });
  if (!response.ok) {
    let data;
    try { data = await response.json(); } catch { data = {}; }
    const error = new ApiError({ message: data?.message || `Unable to load PDF (HTTP ${response.status}).`, status: response.status, code: data?.code || "TRAINING_PDF_LOAD_FAILED", method: "GET", url: endpoint });
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT, { detail: {status:401,code:error.code,message:error.message} }));
    throw error;
  }
  const blob = await response.blob();
  if (!/^application\/pdf(?:;|$)/i.test(blob.type)) throw new TypeError("The server did not return a PDF.");
  return blob;
}
