import { useEffect, useRef } from "react";

import ResumeDocument from "../ResumeDocument/ResumeDocument";

import "./ResumePreviewModal.css";

function ResumePreviewModal({ resume, onClose, onExportPdf }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!resume) {
    return null;
  }

  return (
    <div className="resume-preview-backdrop" onClick={onClose}>
      <section
        className="resume-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="resume-preview-toolbar">
          <div>
            <span>Resume Preview</span>

            <h2 id="resume-preview-title">
              {resume.resumeName || "Untitled Resume"}
            </h2>

            <p>{resume.targetRole || "No target position"}</p>
          </div>

          <div className="resume-preview-toolbar-actions">
            <button
              type="button"
              className="resume-preview-pdf-button"
              onClick={onExportPdf}
            >
              <span aria-hidden="true">↓</span>
              Save as PDF
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              className="resume-preview-close-button"
              onClick={onClose}
              aria-label="Close resume preview"
              title="Close preview"
            >
              ×
            </button>
          </div>
        </header>

        <div className="resume-preview-paper-container">
          <ResumeDocument resume={resume} />
        </div>
      </section>
    </div>
  );
}

export default ResumePreviewModal;
