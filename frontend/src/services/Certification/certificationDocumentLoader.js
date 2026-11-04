import { API_BASE_URL } from "../apiClient.js";
import { getCertificationDocumentEndpoint } from "./certificationApiService.js";
import {
  createCertificationDocumentUrl as createLocalDocumentUrl,
  revokeCertificationDocumentUrl,
} from "./certificationDocumentStorage.js";

export { revokeCertificationDocumentUrl };

export async function createCertificationDocumentUrl(document) {
  const certificationId = document?.certificationId;
  const documentId = document?.id;

  if (certificationId && documentId) {
    const endpoint = getCertificationDocumentEndpoint(
      certificationId,
      documentId,
    );

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/pdf, image/*, application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Certificate document request failed (HTTP ${response.status}).`,
      );
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("The backend returned an empty certificate document.");
    }

    return URL.createObjectURL(blob);
  }

  if (document?.storageKey) {
    return createLocalDocumentUrl(document.storageKey);
  }

  return "";
}