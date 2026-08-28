import { useEffect, useId, useRef, useState } from "react";
import "./CertificateViewer.css";

function CertificateViewer({ certificate, isOwner = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  const fileUrl = certificate?.fileUrl ?? "";
  const fileType = certificate?.fileType ?? "";
  const fileName = certificate?.fileName ?? "";
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [isOpen]);

  if (!certificate) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "certificate";
    link.click();
  };

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className="certificate-viewer"
        onClick={() => fileUrl && setIsOpen(true)}
        disabled={!fileUrl}
        aria-label={
          fileUrl
            ? `View ${certificate.name}`
            : `No document attached to ${certificate.name}`
        }
      >
        <div className="certificate-thumbnail">
          {isImage && fileUrl ? (
            <img src={fileUrl} alt="" />
          ) : (
            <div className="certificate-document-preview">
              <span className="certificate-document-icon">
                {isPdf ? "PDF" : fileUrl ? "DOC" : "—"}
              </span>
              <span>
                {fileUrl ? "Certificate document" : "No document attached"}
              </span>
            </div>
          )}
          {fileUrl && (
            <div className="certificate-hover-overlay">
              <span>View Certificate</span>
            </div>
          )}
        </div>
        <div className="certificate-viewer-info">
          <strong>{certificate.name}</strong>
          <span>{certificate.issuingOrganization || certificate.issuer}</span>
        </div>
      </button>

      {isOpen && (
        <div
          className="certificate-modal-overlay"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setIsOpen(false)
          }
        >
          <div
            className="certificate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="certificate-modal-header">
              <div className="certificate-modal-title-area">
                <span className="certificate-modal-eyebrow">Certificate</span>
                <h3 id={titleId}>{certificate.name}</h3>
                {certificate.issuingOrganization && (
                  <p>{certificate.issuingOrganization}</p>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="certificate-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close certificate viewer"
              >
                ×
              </button>
            </header>

            <div className="certificate-modal-content">
              {isImage ? (
                <img
                  className="certificate-large-image"
                  src={fileUrl}
                  alt={`${certificate.name} certificate`}
                />
              ) : isPdf ? (
                <iframe
                  className="certificate-pdf-frame"
                  src={fileUrl}
                  title={`${certificate.name} certificate`}
                />
              ) : (
                <div className="certificate-unavailable">
                  <div className="certificate-unavailable-icon">DOC</div>
                  <strong>Preview unavailable</strong>
                  <p>
                    Word documents cannot be previewed directly in most
                    browsers. Download the file to view it.
                  </p>
                  {fileName && <span>{fileName}</span>}
                </div>
              )}
            </div>

            <footer className="certificate-modal-footer">
              <div className="certificate-modal-details">
                {certificate.issueDate && (
                  <span>Issued: {certificate.issueDate}</span>
                )}
                {certificate.expirationDate && (
                  <span>Expires: {certificate.expirationDate}</span>
                )}
                {certificate.credentialId && (
                  <span>ID: {certificate.credentialId}</span>
                )}
              </div>
              {isOwner && (
                <button
                  type="button"
                  className="certificate-download-button"
                  onClick={handleDownload}
                >
                  Download Certificate
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

export default CertificateViewer;
