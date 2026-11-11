import { useEffect, useState } from "react";

import { fetchTrainingDocumentLinks } from "../../../../services/Training/trainingDocumentLinkApiService.js";

import CertificationDocumentViewer from "../../../Certifications/components/CertificationDocumentViewer/CertificationDocumentViewer.jsx";

function TrainingLinkedCertificationDocuments({ trainingId }) {
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingDocument, setViewingDocument] = useState(null);

  useEffect(() => {
    let active = true;

    setLinks([]);
    setError("");
    setIsLoading(true);

    if (!trainingId) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    fetchTrainingDocumentLinks(trainingId)
      .then((result) => {
        if (active) {
          setLinks(Array.isArray(result) ? result : []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.publicMessage ||
              requestError?.message ||
              "Linked Certification documents could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [trainingId]);

  const openDocument = (link) => {
    if (!link.certificationId || !link.certificationDocumentId) {
      setError("This Certification document is missing its reference IDs.");
      return;
    }

    const fileName = link.originalFileName || "Certification document";

    setError("");
    setViewingDocument({
      id: link.certificationDocumentId,
      certificationId: link.certificationId,
      fileName,
      name: fileName,
      previewMode: /\.pdf$/i.test(fileName) ? "pdf" : "document",
    });
  };

  return (
    <section className="training-item-detail-section">
      <header className="training-item-section-title">
        <h4>Linked Certification Documents</h4>
        <span>{links.length}</span>
      </header>

      {isLoading ? (
        <p className="training-item-empty-detail">
          Loading linked Certification documents...
        </p>
      ) : error && links.length === 0 ? (
        <p className="training-item-document-error" role="alert">
          {error}
        </p>
      ) : links.length === 0 ? (
        <p className="training-item-empty-detail">
          No Certification documents are linked to this Training.
        </p>
      ) : (
        <div className="training-item-documents">
          {links.map((link) => {
            const fileName =
              link.originalFileName || "Certification document";

            return (
              <article key={link.id}>
                <div className="training-item-document-icon" aria-hidden="true">
                  ◇
                </div>

                <div className="training-item-document-content">
                  <div>
                    <span>Linked Certification</span>
                    <span>
                      {link.mimeType === "application/pdf" ? "PDF" : "Document"}
                    </span>
                  </div>

                  <strong>{fileName}</strong>
                  <small>
                    Original file owned by the Certification record
                  </small>
                </div>

                <div className="training-item-document-actions">
                  <button
                    type="button"
                    onClick={() => openDocument(link)}
                  >
                    View / Download
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {error && links.length > 0 && (
        <p className="training-item-document-error" role="alert">
          {error}
        </p>
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

export default TrainingLinkedCertificationDocuments;