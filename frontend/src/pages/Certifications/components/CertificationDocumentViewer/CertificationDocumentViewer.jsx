import { useEffect, useRef, useState } from "react";

import {
  createCertificationDocumentUrl,
  revokeCertificationDocumentUrl,
} from "../../../../services/Certification/certificationDocumentStorage.js";

import "./CertificationDocumentViewer.css";

function CertificationDocumentViewer({
  document: certificationDocument,
  onClose,
}) {
  const closeButtonRef = useRef(null);

  const [documentUrl, setDocumentUrl] = useState("");

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isActive = true;
    let createdUrl = "";

    setDocumentUrl("");

    if (!certificationDocument?.storageKey) {
      setStatus("missing");

      return undefined;
    }

    setStatus("loading");

    createCertificationDocumentUrl(certificationDocument.storageKey)
      .then((url) => {
        createdUrl = url;

        if (!isActive) {
          revokeCertificationDocumentUrl(url);

          return;
        }

        setDocumentUrl(url);
        setStatus(url ? "ready" : "missing");
      })
      .catch(() => {
        if (isActive) {
          setDocumentUrl("");
          setStatus("error");
        }
      });

    return () => {
      isActive = false;

      revokeCertificationDocumentUrl(createdUrl);
    };
  }, [certificationDocument?.storageKey]);

  useEffect(() => {
    const previouslyFocusedElement = window.document.activeElement;

    const previousOverflow = window.document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    closeButtonRef.current?.focus();

    return () => {
      window.document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);

      previouslyFocusedElement?.focus?.();
    };
  }, [onClose]);

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleDownload = () => {
    if (!documentUrl) {
      return;
    }

    const link = window.document.createElement("a");

    link.href = documentUrl;

    link.download =
      certificationDocument?.fileName ||
      certificationDocument?.name ||
      "certificate";

    window.document.body.appendChild(link);

    link.click();

    link.remove();
  };

  const previewMode = certificationDocument?.previewMode || "document";

  const documentTitle =
    certificationDocument?.name ||
    certificationDocument?.fileName ||
    "Certificate";

  const requiresDownload = previewMode === "word" || previewMode === "document";

  return (
    <div
      className="certification-document-viewer-backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        className="certification-document-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certification-document-viewer-title"
        aria-describedby="certification-document-viewer-description"
      >
        <header>
          <div>
            <span>Certificate Document</span>

            <h2 id="certification-document-viewer-title">{documentTitle}</h2>

            <p
              id="certification-document-viewer-description"
              className="certification-document-viewer-description"
            >
              Preview or download the stored certificate document.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close document viewer"
          >
            ×
          </button>
        </header>

        <div className="certification-document-viewer-content">
          {status === "loading" && (
            <div
              className="certification-document-viewer-state"
              role="status"
              aria-live="polite"
            >
              <span
                className="certification-document-viewer-loader"
                aria-hidden="true"
              />

              <strong>Loading document</strong>

              <p>Retrieving the certificate from browser storage.</p>
            </div>
          )}

          {(status === "missing" || status === "error") && (
            <div
              className="certification-document-viewer-state certification-document-viewer-state--error"
              role="alert"
            >
              <span aria-hidden="true">!</span>

              <strong>The document could not be loaded</strong>

              <p>
                The metadata exists, but its saved certificate file is
                unavailable in browser storage.
              </p>
            </div>
          )}

          {status === "ready" && previewMode === "image" && (
            <img src={documentUrl} alt={documentTitle} />
          )}

          {status === "ready" && previewMode === "pdf" && (
            <iframe
              src={`${documentUrl}#toolbar=1&navpanes=1`}
              title={`${documentTitle} PDF`}
            />
          )}

          {status === "ready" && requiresDownload && (
            <div className="certification-document-viewer-state">
              <span
                className="certification-document-viewer-file-icon"
                aria-hidden="true"
              >
                {previewMode === "word" ? "DOC" : "FILE"}
              </span>

              <strong>Preview unavailable for this file format</strong>

              <p>
                Download the document and open it in a compatible application.
              </p>

              <button
                type="button"
                className="certification-document-viewer-inline-download"
                onClick={handleDownload}
              >
                Download Document
              </button>
            </div>
          )}
        </div>

        <footer>
          <span title={certificationDocument?.fileName || documentTitle}>
            {certificationDocument?.fileName || documentTitle}
          </span>

          <div>
            <button type="button" onClick={onClose}>
              Close
            </button>

            <button
              type="button"
              className="certification-document-viewer-download"
              onClick={handleDownload}
              disabled={!documentUrl}
            >
              Download
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default CertificationDocumentViewer;
