import { useCallback, useEffect, useMemo, useState } from "react";
import CertificationDocumentPreview from "../../../Certifications/components/CertificationDocumentPreview/CertificationDocumentPreview.jsx";
import CertificationDocumentViewer from "../../../Certifications/components/CertificationDocumentViewer/CertificationDocumentViewer.jsx";

import {
  fetchCertifications,
  fetchCertificationDocuments,
} from "../../../../services/Certification/certificationApiService.js";

import {
  fetchTrainingDocumentLinks,
  createTrainingDocumentLinkApi,
  deleteTrainingDocumentLinkApi,
} from "../../../../services/Training/trainingDocumentLinkApiService.js";

async function loadAvailableDocuments() {
  const certifications = await fetchCertifications();

  if (!Array.isArray(certifications)) {
    throw new TypeError("Invalid Certification API response.");
  }

  const documentGroups = await Promise.all(
    certifications.map(async (certification) => {
      if (typeof certification?.id !== "string") {
        return [];
      }

      const documents = await fetchCertificationDocuments(certification.id);

      if (!Array.isArray(documents)) {
        throw new TypeError("Invalid Certification documents API response.");
      }

      return documents
        .filter((document) => typeof document?.id === "string" && document.id)
        .map((document) => ({
          id: document.id,
          certificationId: certification.id,
          certificationName:
            certification.name || certification.title || "Certification",
          fileName:
            document.originalFileName || document.fileName || "Document",
        }));
    }),
  );

  return documentGroups.flat();
}

export default function TrainingCertificationDocumentLinks({
  trainingId,
  disabled = false,
}) {
  const [links, setLinks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  const refreshLinks = useCallback(async () => {
    const records = await fetchTrainingDocumentLinks(trainingId);
    setLinks(records);
  }, [trainingId]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setReady(false);
    setLinks([]);
    setDocuments([]);
    setSelectedDocumentId("");
    setError("");

    if (!trainingId) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    Promise.all([
      fetchTrainingDocumentLinks(trainingId),
      loadAvailableDocuments(),
    ])
      .then(([records, available]) => {
        if (cancelled) return;

        setLinks(records);
        setDocuments(available);
        setReady(true);
      })
      .catch((caughtError) => {
        if (cancelled) return;

        setError(
          caughtError?.message || "Unable to load Certification documents.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trainingId]);

  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.id, document])),
    [documents],
  );

  const linkedIds = useMemo(
    () => new Set(links.map((link) => link.certificationDocumentId)),
    [links],
  );

  const unlinkedDocuments = useMemo(
    () => documents.filter((document) => !linkedIds.has(document.id)),
    [documents, linkedIds],
  );

  async function handleLink() {
    if (
      !trainingId ||
      !ready ||
      disabled ||
      saving ||
      !unlinkedDocuments.some((document) => document.id === selectedDocumentId)
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createTrainingDocumentLinkApi(trainingId, selectedDocumentId);
      setSelectedDocumentId("");
      await refreshLinks();
    } catch (caughtError) {
      setError(caughtError?.message || "Unable to link document.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(link) {
    if (!trainingId || disabled || saving || !ready) return;

    const confirmed = window.confirm(
      `Unlink "${link.originalFileName || "Document"}" from this Training? ` +
      "The original Certification PDF will not be deleted.",
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await deleteTrainingDocumentLinkApi(trainingId, link.id);
      await refreshLinks();
    } catch (caughtError) {
      setError(caughtError?.message || "Unable to unlink document.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="training-form-section">
      <h3>Linked Certification Documents</h3>

      <p>
        Link existing Certification PDFs without uploading duplicate files.
      </p>

      {error && <p role="alert">{error}</p>}

      {loading && <p>Loading Certification documents...</p>}

      {!loading && ready && (
        <>
          {links.length === 0 && <p>No Certification documents linked.</p>}

          <ul className="training-linked-certification-documents">
            {links.map((link) => {
              const sourceDocument = documentsById.get(
                link.certificationDocumentId,
              );

              const previewDocument = sourceDocument
                ? {
                    ...sourceDocument,
                    name: sourceDocument.fileName,
                    previewMode: /\.pdf$/i.test(sourceDocument.fileName)
                      ? "pdf"
                      : "document",
                  }
                : null;

              return (
                <li key={link.id}>
                  {previewDocument && (
                    <CertificationDocumentPreview
                      document={previewDocument}
                      onView={setViewingDocument}
                    />
                  )}

                  <span>
                    {sourceDocument?.fileName ||
                      link.originalFileName ||
                      "Document"}
                  </span>

                  <button
                    type="button"
                    disabled={disabled || saving}
                    onClick={() => handleUnlink(link)}
                  >
                    Unlink
                  </button>
                </li>
              );
            })}
          </ul>

          <label htmlFor="training-certification-document-link">
            Certification document
          </label>

          <select
            id="training-certification-document-link"
            value={selectedDocumentId}
            onChange={(event) => setSelectedDocumentId(event.target.value)}
            disabled={disabled || saving}
          >
            <option value="">Select a document</option>

            {unlinkedDocuments.map((document) => (
              <option key={document.id} value={document.id}>
                {document.certificationName} — {document.fileName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleLink}
            disabled={disabled || saving || !selectedDocumentId}
          >
            {saving ? "Saving..." : "Link existing document"}
          </button>
        </>
      )}

      {viewingDocument && (
        <CertificationDocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </section>
  );
}