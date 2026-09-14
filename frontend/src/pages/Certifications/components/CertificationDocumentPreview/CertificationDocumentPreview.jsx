import { useEffect, useState } from "react";

import {
  createCertificationDocumentUrl,
  revokeCertificationDocumentUrl,
} from "../../../../services/Certification/certificationDocumentStorage.js";

import "./CertificationDocumentPreview.css";

function CertificationDocumentPreview({
  document: certificationDocument = null,
  onView,
}) {
  const [documentUrl, setDocumentUrl] = useState("");

  const [status, setStatus] = useState(
    certificationDocument ? "loading" : "empty",
  );

  useEffect(() => {
    let isActive = true;
    let createdUrl = "";

    setDocumentUrl("");

    if (!certificationDocument?.storageKey) {
      setStatus(certificationDocument ? "missing" : "empty");

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

  if (!certificationDocument) {
    return (
      <div
        className="certification-document-preview certification-document-preview--empty"
        aria-label="No certificate document"
      >
        <span aria-hidden="true">□</span>

        <strong>No certificate uploaded</strong>
      </div>
    );
  }

  const previewMode = certificationDocument.previewMode || "document";

  const documentName =
    certificationDocument.name ||
    certificationDocument.fileName ||
    "certificate";

  const isWordDocument = previewMode === "word";

  const isGenericDocument = previewMode === "document";

  const cannotRenderVisualPreview = status === "missing" || status === "error";

  return (
    <button
      type="button"
      className="certification-document-preview"
      onClick={() => onView?.(certificationDocument)}
      aria-label={`View ${documentName}`}
    >
      {status === "loading" && (
        <span
          className="certification-document-preview-loader"
          aria-label="Loading certificate preview"
        />
      )}

      {status === "ready" && previewMode === "image" && (
        <img src={documentUrl} alt="" />
      )}

      {status === "ready" && previewMode === "pdf" && (
        <object
          data={`${documentUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
          type="application/pdf"
          aria-label="PDF certificate preview"
          tabIndex="-1"
        >
          <span className="certification-document-preview-file">PDF</span>
        </object>
      )}

      {isWordDocument && (
        <span
          className="certification-document-preview-file"
          aria-hidden="true"
        >
          DOC
        </span>
      )}

      {isGenericDocument && (
        <span
          className="certification-document-preview-file"
          aria-hidden="true"
        >
          FILE
        </span>
      )}

      {cannotRenderVisualPreview && !isWordDocument && !isGenericDocument && (
        <span
          className="certification-document-preview-file certification-document-preview-file--error"
          aria-hidden="true"
        >
          !
        </span>
      )}

      <span className="certification-document-preview-overlay">
        View Certificate
      </span>
    </button>
  );
}

export default CertificationDocumentPreview;
