import { useEffect, useState } from "react";

import "./CertificateViewer.css";

function CertificateViewer({ certificate, isOwner = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const isImage = certificate?.fileType?.startsWith("image/");

  const isPdf = certificate?.fileType === "application/pdf";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!certificate) {
    return null;
  }

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleDownload = () => {
    if (!certificate.fileUrl) {
      return;
    }

    const link = document.createElement("a");

    link.href = certificate.fileUrl;

    link.download = certificate.fileName || "certificate";

    link.target = "_blank";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <>
      <button
        type="button"
        className="certificate-viewer"
        onClick={handleOpen}
        aria-label={`View ${certificate.name}`}
      >
        <div className="certificate-thumbnail">
          {isImage && certificate.fileUrl ? (
            <img
              src={certificate.fileUrl}
              alt={`${certificate.name} certificate`}
            />
          ) : (
            <div className="certificate-document-preview">
              <span className="certificate-document-icon">
                {isPdf ? "PDF" : "DOC"}
              </span>

              <span>Certificate</span>
            </div>
          )}

          <div className="certificate-hover-overlay">
            <span>View Certificate</span>
          </div>
        </div>

        <div className="certificate-viewer-info">
          <strong>{certificate.name}</strong>

          <span>{certificate.issuingOrganization}</span>
        </div>
      </button>

      {isOpen && (
        <div
          className="certificate-modal-overlay"
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div
            className="certificate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificate-modal-title"
          >
            <div className="certificate-modal-header">
              <div>
                <span className="certificate-modal-eyebrow">Certificate</span>

                <h3 id="certificate-modal-title">{certificate.name}</h3>

                <p>{certificate.issuingOrganization}</p>
              </div>

              <button
                type="button"
                className="certificate-close-button"
                onClick={handleClose}
                aria-label="Close certificate viewer"
              >
                ×
              </button>
            </div>

            <div className="certificate-modal-content">
              {isImage && certificate.fileUrl ? (
                <img
                  className="certificate-large-image"
                  src={certificate.fileUrl}
                  alt={`${certificate.name} certificate`}
                />
              ) : isPdf && certificate.fileUrl ? (
                <iframe
                  className="certificate-pdf-frame"
                  src={certificate.fileUrl}
                  title={`${certificate.name} certificate`}
                />
              ) : (
                <div className="certificate-unavailable">
                  <span>Document Preview</span>

                  <p>This document cannot be previewed in the browser.</p>
                </div>
              )}
            </div>

            <div className="certificate-modal-footer">
              <div className="certificate-modal-details">
                {certificate.issueDate && (
                  <span>Issued: {certificate.issueDate}</span>
                )}

                {certificate.credentialId && (
                  <span>ID: {certificate.credentialId}</span>
                )}
              </div>

              {isOwner && certificate.fileUrl && (
                <button
                  type="button"
                  className="certificate-download-button"
                  onClick={handleDownload}
                >
                  Download Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CertificateViewer;
